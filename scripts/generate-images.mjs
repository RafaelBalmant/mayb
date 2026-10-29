// Makes the lighter copies of the doctor's photo (public/profile/photo.jpg) that the site serves:
// - profile/photo-600 and photo-1200 in AVIF and WebP, for the start page (<picture> with srcset);
// - share.jpg, 1200×630, the link preview (og:image) cut around the face.
// Run again after replacing the photo: npm run images (the results are committed, like the photo itself).
import sharp from "sharp";

const PUBLIC = new URL("../public/", import.meta.url);
const PHOTO = new URL("profile/photo.jpg", PUBLIC).pathname;
const WIDTHS = [600, 1200];
const FORMATS = { avif: { quality: 55 }, webp: { quality: 78 } };
/** Band of the 1200×1500 photo used for the link preview (top of the band, in px): the face sits inside it. */
const SHARE_TOP = 260;
const SHARE = { width: 1200, height: 630 };

for (const width of WIDTHS) {
  for (const [format, options] of Object.entries(FORMATS)) {
    const out = new URL(`profile/photo-${width}.${format}`, PUBLIC).pathname;
    await sharp(PHOTO).resize({ width })[format](options).toFile(out);
    console.log(`images: ${out}`);
  }
}

const { width } = await sharp(PHOTO).metadata();
await sharp(PHOTO)
  .extract({ left: 0, top: SHARE_TOP, width, height: Math.round((width * SHARE.height) / SHARE.width) })
  .resize(SHARE)
  .jpeg({ quality: 82, progressive: true, mozjpeg: true })
  .toFile(new URL("share.jpg", PUBLIC).pathname);
console.log("images: share.jpg");
