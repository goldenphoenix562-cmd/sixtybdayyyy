/*
  Audio helpers for the background music and voice note.
  This keeps the media logic easy to customize without cluttering the main story controller.
*/

window.BirthdayStoryAudio = window.BirthdayStoryAudio || {};

window.BirthdayStoryAudio.formatTime = function (seconds) {
  if (!Number.isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remaining}`;
};

window.BirthdayStoryAudio.applyPlaybackState = function (audio, isPlaying) {
  if (!audio) return;

  if (isPlaying) {
    audio.play().catch(() => {});
  } else {
    audio.pause();
  }
};
