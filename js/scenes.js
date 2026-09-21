/*
  Scene helpers for the birthday story.
  Keep this file lightweight and add any reusable scene logic here if you want to expand the experience.
*/

window.BirthdayStoryScenes = window.BirthdayStoryScenes || {};

window.BirthdayStoryScenes.applySceneState = function (sceneList, targetIndex) {
  if (!Array.isArray(sceneList) || !sceneList.length) return;

  const safeIndex = Math.max(0, Math.min(targetIndex, sceneList.length - 1));

  sceneList.forEach((scene, index) => {
    const active = index === safeIndex;
    scene.classList.toggle("is-active", active);
    scene.setAttribute("aria-hidden", active ? "false" : "true");
  });
};

window.BirthdayStoryScenes.toggleVisibility = function (element, visible) {
  if (!element) return;
  element.classList.toggle("is-hidden", !visible);
  element.setAttribute("aria-hidden", visible ? "false" : "true");
};
