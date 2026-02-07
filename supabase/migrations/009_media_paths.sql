-- ============================================
-- Update stories + testimonials with local image/video paths
-- ============================================

-- STORIES
UPDATE public.stories SET
  img_before = 'images/transformations/dhruvi-ankit-before.jpg',
  img_after = 'images/transformations/dhruvi-ankit-after.jpg',
  video_url = 'images/transformations/dhruvi-ankit-video.mp4'
WHERE author_name = 'Dhruvi and Ankit';

UPDATE public.stories SET
  img_before = 'images/transformations/disha-before.jpg',
  img_after = 'images/transformations/disha-after.jpg'
WHERE author_name = 'Disha Jain';

UPDATE public.stories SET
  img_after = 'images/transformations/adeep-after.jpg'
WHERE author_name = 'Adeep Jain';

UPDATE public.stories SET
  img_before = 'images/transformations/myraa-before.jpg',
  img_after = 'images/transformations/myraa-after.jpg',
  video_url = 'images/transformations/myraa-video.mp4'
WHERE author_name = 'Myraa';

UPDATE public.stories SET
  img_before = 'images/transformations/reetika-before.jpg',
  img_after = 'images/transformations/reetika-after.jpeg'
WHERE author_name = 'Reetika Jain';

-- TESTIMONIALS (homepage carousel)
UPDATE public.testimonials SET
  img_before = 'images/transformations/dhruvi-ankit-before.jpg',
  img_after = 'images/transformations/dhruvi-ankit-after.jpg',
  video_url = 'images/transformations/dhruvi-ankit-video.mp4'
WHERE id = 'test-1';

UPDATE public.testimonials SET
  img_before = 'images/transformations/disha-before.jpg',
  img_after = 'images/transformations/disha-after.jpg'
WHERE id = 'test-2';

UPDATE public.testimonials SET
  img_after = 'images/transformations/adeep-after.jpg'
WHERE id = 'test-3';

UPDATE public.testimonials SET
  img_before = 'images/transformations/myraa-before.jpg',
  img_after = 'images/transformations/myraa-after.jpg',
  video_url = 'images/transformations/myraa-video.mp4'
WHERE id = 'test-4';

UPDATE public.testimonials SET
  img_before = 'images/transformations/reetika-before.jpg',
  img_after = 'images/transformations/reetika-after.jpeg'
WHERE id = 'test-5';
