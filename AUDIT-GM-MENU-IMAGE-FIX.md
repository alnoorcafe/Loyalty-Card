# AL NOOR GM Menu Image Fix

Changed only the GM Menu image flow and Customer Menu image rendering.

- GM Menu category image uses Choose File, not URL.
- Selected images are resized/compressed in the browser and saved in `menu_categories.image_url`.
- Changing a category image replaces the stored image value.
- GM Menu item image uses the same file picker flow.
- Customer Menu accepts only valid image sources and never prints an image URL as visible text.
- Broken/invalid legacy image URLs fall back to the category icon instead of showing broken URL text.
- Category loading retries without `sort_order` if that column/query fails.
- Price Display and official-menu import are not present on the GM Menu page.
- Service-worker cache version bumped so the corrected files are refreshed.
