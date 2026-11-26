<script setup lang="ts">
import { ref } from 'vue';

// Pre-recorded demo clip. Until the video exists, shows which tag/script it should be recorded from.
const props = defineProps<{ src: string; tag: string }>();
const missing = ref(false);
const base = import.meta.env.BASE_URL;
</script>

<template>
  <video v-if="!missing" class="clip" :src="`${base}videos/${props.src}`" controls preload="auto" @error="missing = true" />
  <div v-else class="clip clip-missing">
    <div>🎬 record <code>videos/{{ props.src }}</code></div>
    <div>from git tag <code>{{ props.tag }}</code>, script in <code>demo/scripts/</code></div>
  </div>
</template>

<style scoped>
.clip {
  width: 100%;
  max-height: 78vh;
  border-radius: 8px;
  background: #0b1020;
}
.clip-missing {
  aspect-ratio: 16 / 9;
  max-height: 70vh;
  display: grid;
  place-content: center;
  gap: 0.6rem;
  text-align: center;
  border: 3px dashed var(--brand-mint);
}
</style>
