# Image generation prompts

Every image the lab needs, with the prompt to paste into ChatGPT (or Gemini),
the exact filename to save as, and where to put it. After dropping files in,
set the matching `EXT` constant in `frontend/src/data/manifests.js` (for
example `W14_EXT = 'png'`) and rebuild.

All generated images: 1024x1024 or larger, saved as PNG or JPG. Keep them
unedited; the artifacts and the biases ARE the content.

## One warning before you start

ChatGPT quietly rewrites image prompts to add demographic diversity. For W14
(spot the fake) that does not matter. For W12 it cuts against the lesson: the
point is to show the model's raw defaults, and a sanitized grid shows the
safety layer instead. The PRD's original plan (Gemini or Imagen) gives a
truer W12. If you only have ChatGPT, still do it; the explain panel already
handles a balanced grid ("what does it imply that the vendor had to correct
it?"), but know what you are measuring.

## W12: Picture the Job (64 images)

Sixteen images per prompt. Ask for one image at a time (batch generations
share a composition and look samey). Use the bare prompt with no style words
and no diversity words; the bareness is the experiment.

| Grid | Prompt (verbatim, 16 times each) | Save as |
|---|---|---|
| CEO | `A photo of a CEO` | `frontend/public/images/w12/ceo/1.png` ... `16.png` |
| Nurse | `A photo of a nurse` | `frontend/public/images/w12/nurse/1.png` ... `16.png` |
| Professor | `A photo of a professor` | `frontend/public/images/w12/professor/1.png` ... `16.png` |
| Welfare | `A photo of a person receiving welfare` | `frontend/public/images/w12/welfare/1.png` ... `16.png` |

Set `W12_EXT = 'png'` and update `generatedDate` in `manifests.js`.

## W14: Spot the Fake (6 AI images + 6 real photos)

Each round pairs a REAL photo with an AI image of the same kind of subject.
Save AI images as `pair{N}_ai.png` and real photos as `pair{N}_real.png` in
`frontend/public/images/w14/`. Set `W14_EXT = 'png'`.

AI prompts, written to make the classic artifact families likely. Do not fix
or regenerate an image because something looks off; off is the point. Do
regenerate if the image is TOO obviously broken to be sporting.

| Pair | AI prompt | Artifact it tends to produce |
|---|---|---|
| pair1 | `A candid photo of a smiling person waving at the camera with an open hand, fingers spread, outdoors in daylight` | Hands and fingers |
| pair2 | `A photo of a small-town storefront with several signs, posters in the window, and text on the awning` | Garbled text |
| pair3 | `A wide photo of an ornate interior staircase with railings, seen from the ground floor` | Impossible geometry |
| pair4 | `A photo of a person adjusting their jacket in front of a large mirror, both the person and the reflection visible` | Reflections |
| pair5 | `A close-up photo of two hands holding a fanned hand of playing cards at a table` | Hands plus card text |
| pair6 | `A busy pedestrian street scene with many people walking, storefronts and buildings in the background` | Background faces and lines |

Real halves: use your own phone photos (fastest and safest), or public-domain
photos from Wikimedia Commons (commons.wikimedia.org, filter by
"Public domain" license) matching each subject: a person waving, a
storefront, a staircase, a mirror shot, hands holding cards, a street crowd.
Match the AI image's general look (color photo, similar framing) so the game
is about artifacts, not photo quality.

After dropping images in, sanity-check `W14_PAIRS` in `manifests.js`: the
`artifact` and `note` fields must describe what YOUR generated image actually
shows, because they are revealed to students after each round.

## W13: Count the Coins (6 photos, do not generate these)

Counting images must be real photographs with counts you did yourself; a
generated image of "17 coins" will not contain 17 coins. Ten minutes with a
phone: coins on a table, jellybeans in a pile, scattered toothpicks, pencils
in a cup, books on a shelf, and any crowd photo you have rights to. Count
each, save as `frontend/public/images/w13/{coins,jellybeans,toothpicks,pencils,books,crowd}.png`,
and set each `trueCount` in `manifests.js`. Keep counts between 14 and 27.
The shipped SVG placeholders have exact counts and work fine if you skip this.

## Widget header illustrations (15 images, optional polish)

One per module, same prompt skeleton so they read as a set. Replace the
bracketed subject, keep everything else identical:

`Minimal flat vector illustration of [SUBJECT], white background, one accent
color of deep red (#C8102E), dark gray line work, no text anywhere in the
image, clean geometric style`

| File (save under `frontend/public/images/headers/`) | Subject |
|---|---|
| `w1.png` | a row of five word-probability bars of descending height |
| `w2.png` | two identical documents, one casting a different shadow |
| `w3.png` | a gavel resting on a stack of court papers |
| `w4.png` | a speech bubble containing a question mark, repeated three times in a row |
| `w5.png` | a golf flag planted in an open law book |
| `w7.png` | a portrait frame with a quotation mark inside |
| `ttl.png` | three cards, one subtly different from the other two |
| `w8.png` | a bar chart where one tall bar towers over many short ones |
| `w9.png` | a balance scale weighing two speech bubbles |
| `w10.png` | two identical resumes side by side |
| `w11.png` | a map with one neighborhood highlighted and a magnifying glass |
| `w12.png` | a four by four grid of empty portrait frames |
| `w13.png` | scattered coins with a large question mark |
| `w14.png` | a photograph splitting into pixel squares at one corner |
| `fc.png` | a document with three sentences flagged in red |

The app hides any header image that is missing, so partial sets are fine.
