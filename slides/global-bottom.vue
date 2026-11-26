<!-- White footer strip with DEV.BG logo, as in the official template. -->
<template>
  <footer class="devbg-footer">
    <span>DEV.BG · JavaScript · 28.01.2027</span>
    <img src="/brand/devbg-logo.png" alt="DEV.BG" />
  </footer>
</template>

<style scoped>
.devbg-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  height: 2.6rem;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.5rem;
  background: white;
  color: var(--brand-grey);
  font-family: 'Montserrat', Arial, sans-serif;
  font-size: 0.75rem;
}
.devbg-footer img {
  height: 1rem;
}
</style>
