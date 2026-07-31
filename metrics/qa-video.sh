#!/usr/bin/env bash
set -euo pipefail

video_path="${1:?usage: qa-video.sh VIDEO_PATH OUTPUT_DIR LABEL [MIN_DURATION_SECONDS]}"
output_dir="${2:?usage: qa-video.sh VIDEO_PATH OUTPUT_DIR LABEL [MIN_DURATION_SECONDS]}"
label="${3:?usage: qa-video.sh VIDEO_PATH OUTPUT_DIR LABEL [MIN_DURATION_SECONDS]}"
min_duration_seconds="${4:-10}"

if [[ ! -r "$video_path" ||
      ! "$label" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ||
      ! "$min_duration_seconds" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  echo "invalid video or label" >&2
  exit 2
fi

mkdir -p "$output_dir"
probe_path="$output_dir/$label-ffprobe.json"
contact_path="$output_dir/$label-contact-sheet.jpg"
qa_path="$output_dir/$label-video-qa.json"

ffprobe \
  -v error \
  -count_frames \
  -select_streams v:0 \
  -show_entries \
  stream=codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate,duration,nb_frames,nb_read_frames \
  -of json \
  "$video_path" \
  > "$probe_path"

change_stats="$(
  ffmpeg \
    -hide_banner \
    -loglevel error \
    -i "$video_path" \
    -vf "fps=1,tblend=all_mode=difference,signalstats,metadata=print:file=-" \
    -an \
    -f null \
    - \
    2> /dev/null |
    awk -F= '
      /lavfi.signalstats.YAVG/ {
        n += 1;
        sum += $2;
        if ($2 > max) max = $2;
        if ($2 >= 0.5) above_half += 1;
        if ($2 >= 1.0) above_one += 1;
      }
      END {
        printf "%d %.9f %.9f %d %d\n",
          n,
          n ? sum / n : 0,
          max,
          above_half,
          above_one;
      }
    '
)"
read -r sample_count difference_mean difference_max above_half above_one \
  <<< "$change_stats"

distinct_frame_count="$(
  ffmpeg \
    -hide_banner \
    -loglevel error \
    -nostats \
    -i "$video_path" \
    -vf mpdecimate \
    -an \
    -f null \
    - \
    -progress pipe:1 |
    awk -F= '$1 == "frame" { frames = $2 } END { print frames + 0 }'
)"

ffmpeg \
  -hide_banner \
  -loglevel error \
  -y \
  -i "$video_path" \
  -vf "fps=1/5,scale=640:-2,tile=3x2:padding=8:margin=8:color=0x071018" \
  -frames:v 1 \
  -q:v 2 \
  "$contact_path"

codec="$(jq -r '.streams[0].codec_name // ""' "$probe_path")"
width="$(jq -r '.streams[0].width // 0' "$probe_path")"
height="$(jq -r '.streams[0].height // 0' "$probe_path")"
rate="$(jq -r '.streams[0].avg_frame_rate // "0/1"' "$probe_path")"
duration="$(jq -r '.streams[0].duration // 0' "$probe_path")"
frame_count="$(jq -r '.streams[0].nb_read_frames // .streams[0].nb_frames // 0' "$probe_path")"

container_pass=false
if [[ "$codec" == "h264" &&
      "$width" == "1920" &&
      "$height" == "1080" &&
      "$rate" == "60/1" ]] &&
   awk -v d="$duration" -v minimum="$min_duration_seconds" \
     'BEGIN { exit !(d >= minimum) }'
then
  container_pass=true
fi

temporal_pass=false
if (( above_half >= 2 )) ||
   awk -v avg="$difference_mean" -v max="$difference_max" \
     'BEGIN { exit !(avg >= 0.10 && max >= 0.25) }'
then
  temporal_pass=true
fi

distinct_frame_rate="$(
  awk -v frames="$distinct_frame_count" -v seconds="$duration" \
    'BEGIN { printf "%.6f", (seconds > 0 ? frames / seconds : 0) }'
)"
smooth_motion_pass=false
if awk -v fps="$distinct_frame_rate" 'BEGIN { exit !(fps >= 45) }'
then
  smooth_motion_pass=true
fi

jq -n \
  --arg schema "qwen-gauntlet-video-qa-v2" \
  --arg video "$(basename "$video_path")" \
  --arg contact_sheet "$(basename "$contact_path")" \
  --arg codec "$codec" \
  --argjson width "$width" \
  --argjson height "$height" \
  --arg rate "$rate" \
  --argjson duration "$duration" \
  --argjson minimum_duration "$min_duration_seconds" \
  --argjson frame_count "$frame_count" \
  --argjson temporal_samples "$sample_count" \
  --argjson difference_mean "$difference_mean" \
  --argjson difference_max "$difference_max" \
  --argjson samples_above_half "$above_half" \
  --argjson samples_above_one "$above_one" \
  --argjson distinct_frame_count "$distinct_frame_count" \
  --argjson distinct_frame_rate "$distinct_frame_rate" \
  --argjson container_pass "$container_pass" \
  --argjson temporal_pass "$temporal_pass" \
  --argjson smooth_motion_pass "$smooth_motion_pass" \
  '{
    schema: $schema,
    video: $video,
    contact_sheet: $contact_sheet,
    container: {
      codec: $codec,
      width: $width,
      height: $height,
      avg_frame_rate: $rate,
      duration_seconds: $duration,
      minimum_duration_seconds: $minimum_duration,
      frame_count: $frame_count,
      pass: $container_pass
    },
    temporal_change: {
      method: "1 Hz successive-frame absolute difference; YAVG signal",
      samples: $temporal_samples,
      mean: $difference_mean,
      max: $difference_max,
      samples_at_or_above_0_5: $samples_above_half,
      samples_at_or_above_1_0: $samples_above_one,
      pass: $temporal_pass
    },
    smooth_motion: {
      method: "FFmpeg mpdecimate visually-distinct frame count divided by duration",
      distinct_frames: $distinct_frame_count,
      estimated_distinct_frames_per_second: $distinct_frame_rate,
      minimum_distinct_frames_per_second: 45,
      pass: $smooth_motion_pass
    },
    automated_accept: ($container_pass and $temporal_pass and $smooth_motion_pass),
    human_contact_sheet_review_required: true
  }' > "$qa_path"

cat "$qa_path"
