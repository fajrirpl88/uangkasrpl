import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' membuat aset dimuat secara relatif, jadi aman untuk GitHub Pages
// (https://username.github.io/nama-repo/) tanpa perlu mengubah apa pun.
export default defineConfig({
  plugins: [react()],
  base: './',
});
