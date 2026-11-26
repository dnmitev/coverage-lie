<script setup lang="ts">
import { ref } from 'vue';
import { useNav, useSlideContext } from '@slidev/client';

// Demo clip, in order of preference:
// 1. local file public/videos/<src> (gitignored, for the live talk: no buffering, no YouTube UI)
// 2. YouTube embed, when `youtube` (the unlisted video's id) is set
// 3. placeholder saying what to record
// Only the main slide view plays video. Exports (PDF/PPTX), presenter mode, previews and the overview show
// the YouTube thumbnail + link instead (no second player in presenter mode, nothing to play in a PDF).
const props = defineProps<{ src: string; tag: string; youtube?: string }>();
const { $renderContext } = useSlideContext();
const localMissing = ref(false);
const base = import.meta.env.BASE_URL;
const { isPrintMode } = useNav();
// Export (PDF/PPTX) renders in the 'slide' context too, so check print mode explicitly.
const isStatic = $renderContext.value !== 'slide' || isPrintMode.value;
const watchUrl = props.youtube ? `https://youtu.be/${props.youtube}` : '';
</script>

<template>
  <a v-if="isStatic && youtube" :href="watchUrl" class="clip clip-thumb" target="_blank">
    <img :src="`https://i.ytimg.com/vi/${youtube}/hqdefault.jpg`" alt="" />
    <span>▶ watch on YouTube: {{ watchUrl }}</span>
  </a>
  <video
    v-else-if="!isStatic && !localMissing"
    class="clip"
    :src="`${base}videos/${src}`"
    controls
    preload="auto"
    @error="localMissing = true"
  />
  <iframe
    v-else-if="youtube && !isStatic"
    class="clip"
    :src="`https://www.youtube-nocookie.com/embed/${youtube}?rel=0&modestbranding=1&playsinline=1`"
    title="Demo video"
    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
    allowfullscreen
  />
  <div v-else-if="isStatic" class="clip clip-missing"><div>🎬 demo video: <code>{{ src }}</code></div></div>
  <div v-else class="clip clip-missing">
    <div>🎬 record <code>videos/{{ src }}</code></div>
    <div>from <code>{{ tag }}</code>, script in <code>demo/scripts/</code>, then set <code>youtube="…"</code> on this slide</div>
  </div>
</template>

<style scoped>
.clip {
  /* slide canvas is ~61rem x 34rem; leave room for the title and the footer */
  width: 42rem;
  max-width: 100%;
  aspect-ratio: 16 / 9;
  border: 0;
  border-radius: 8px;
  background: #0b1020;
}
.clip-missing {
  display: grid;
  place-content: center;
  gap: 0.6rem;
  text-align: center;
  border: 3px dashed var(--brand-mint);
}
.clip-thumb {
  position: relative;
  display: block;
  overflow: hidden;
}
.clip-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
}
.clip-thumb span {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  font-size: 1.1rem;
  white-space: nowrap;
}
</style>
