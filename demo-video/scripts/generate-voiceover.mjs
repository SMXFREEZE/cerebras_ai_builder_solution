import fs from "node:fs/promises";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "..");
const scriptPath = path.join(__dirname, "loom-voiceover.txt");
const outputDir = path.join(projectDir, "public", "narration");
const outputPath = path.join(outputDir, "loom-voiceover.wav");

async function generateOnWindows() {
  const ps = `
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech
$text = [System.IO.File]::ReadAllText($env:ASSETOPS_VOICE_TEXT)
$output = $env:ASSETOPS_VOICE_OUTPUT
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice = $synth.GetInstalledVoices() |
  Where-Object { $_.VoiceInfo.Culture.Name -like "en*" } |
  Select-Object -First 1
if ($voice -ne $null) {
  $synth.SelectVoice($voice.VoiceInfo.Name)
}
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile($output)
$synth.Speak($text)
$synth.Dispose()
`;

  execFileSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        ASSETOPS_VOICE_TEXT: scriptPath,
        ASSETOPS_VOICE_OUTPUT: outputPath,
      },
    },
  );
}

async function main() {
  await fs.mkdir(outputDir, {recursive: true});

  if (process.platform !== "win32") {
    throw new Error(
      "Voiceover generation currently uses Windows System.Speech. Generate public/narration/loom-voiceover.wav manually on this platform, then rerun the render.",
    );
  }

  await generateOnWindows();
  console.log(`Generated voiceover: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
