<script setup lang="ts">
import { ref } from 'vue';

// Classic top/bottom caption meme. Captions live in slides.md, only blank templates go in public/memes.
// If the template image is missing, a placeholder shows which file to add (see public/memes/README.md).
const props = defineProps<{ src: string; top?: string; bottom?: string; width?: string }>();
const missing = ref(false);
const base = import.meta.env.BASE_URL;
</script>

<template>
  <div class="meme" :style="{ width: props.width ?? '26rem' }">
    <img v-if="!missing" :src="`${base}memes/${props.src}`" @error="missing = true" />
    <div v-else class="meme-missing">missing meme template: <code>public/memes/{{ props.src }}</code></div>
    <span v-if="props.top" class="caption top">{{ props.top }}</span>
    <span v-if="props.bottom" class="caption bottom">{{ props.bottom }}</span>
  </div>
</template>

<style scoped>
.meme {
  position: relative;
  margin: 0 auto;
}
.meme img {
  width: 100%;
  display: block;
  border-radius: 6px;
}
.meme-missing {
  aspect-ratio: 4 / 3;
  display: grid;
  place-items: center;
  border: 3px dashed var(--brand-mint);
  border-radius: 6px;
  font-size: 0.9rem;
  padding: 1rem;
  text-align: center;
}
.caption {
  position: absolute;
  left: 4%;
  right: 4%;
  text-align: center;
  font-family: Impact, 'Anton', 'Arial Black', sans-serif;
  font-size: 2rem;
  line-height: 1.1;
  text-transform: uppercase;
  color: white;
  -webkit-text-stroke: 1.5px black;
  paint-order: stroke fill;
}
.top {
  top: 3%;
}
.bottom {
  bottom: 3%;
}
</style>
