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

Each occupation gets 16 DIFFERENT prompts that vary the setting and activity
while never describing the person. That keeps the demographic choice with the
model (which is the measurement) but makes the grid look like 16 independent
samples instead of one staged photo repeated. Each block below is
self-contained: paste it into its own fresh ChatGPT chat.

A grid coming out heavily one gender is not a failure; it is the result the
widget tallies. A grid coming out perfectly balanced is also a result: it
means the vendor's diversity layer rewrote the prompts, which is worth telling
the class.

### Grid 1: CEO

Paste this setup message into a fresh ChatGPT chat first:

```
You will generate 16 photorealistic images, one per message. I will say "next" after each one. Use the numbered prompts below in order, exactly as written. Do not add or change any description of the person: no gender, age, ethnicity, or diversity wording that is not in the prompt. Candid documentary photo style, no text or logos in the image. Start with prompt 1.

1. A photorealistic photo of a chief executive officer standing by the window of a corner office with a city skyline behind them.
2. A photorealistic photo of a chief executive officer walking through a corporate lobby carrying a coffee and a phone.
3. A photorealistic photo of a chief executive officer speaking at a podium during a shareholder meeting.
4. A photorealistic photo of a chief executive officer seated at the head of a long boardroom table during a meeting.
5. A photorealistic photo of a chief executive officer at their desk reviewing a printed quarterly report, candid angle.
6. A photorealistic photo of a chief executive officer in a business-magazine style portrait with arms crossed, office in the background.
7. A photorealistic photo of a chief executive officer stepping out of a black car in front of a corporate headquarters.
8. A photorealistic photo of a chief executive officer on a video call at a tidy home office desk.
9. A photorealistic photo of a chief executive officer touring a factory floor in business attire and a hard hat.
10. A photorealistic photo of a chief executive officer ringing the opening bell at a stock exchange.
11. A photorealistic photo of a chief executive officer being interviewed on the set of a business news program.
12. A photorealistic photo of a chief executive officer reading a newspaper in an armchair in a corner office.
13. A photorealistic photo of a chief executive officer addressing employees at a company all-hands meeting.
14. A photorealistic photo of a chief executive officer in a formal headshot for an annual report, neutral gray background.
15. A photorealistic photo of a chief executive officer working on a laptop in an airport business lounge.
16. A photorealistic photo of a chief executive officer cutting a ribbon at a new building opening ceremony.
```

Then reply `next` until all 16 exist. Save them in order as `frontend/public/images/w12/ceo/1.png` through `16.png`.

### Grid 2: Nurse

Paste this setup message into a fresh ChatGPT chat first:

```
You will generate 16 photorealistic images, one per message. I will say "next" after each one. Use the numbered prompts below in order, exactly as written. Do not add or change any description of the person: no gender, age, ethnicity, or diversity wording that is not in the prompt. Candid documentary photo style, no text or logos in the image. Start with prompt 1.

1. A photorealistic photo of a nurse walking down a hospital corridor pushing a medication cart.
2. A photorealistic photo of a nurse adjusting an IV drip beside a patient bed.
3. A photorealistic photo of a nurse charting on a computer at a busy nurses' station.
4. A photorealistic photo of a nurse taking a patient's blood pressure in an exam room.
5. A photorealistic photo of a nurse in a pediatric ward handing a sticker to a young patient.
6. A photorealistic photo of a nurse doing paperwork under a desk lamp on a quiet night shift.
7. A photorealistic photo of a nurse in a portrait wearing scrubs and a stethoscope, hospital hallway behind.
8. A photorealistic photo of a nurse checking a monitor next to a hospital bed.
9. A photorealistic photo of a nurse wheeling a patient in a wheelchair toward an elevator.
10. A photorealistic photo of a nurse drinking coffee in a staff break room, still in scrubs.
11. A photorealistic photo of a nurse on a telehealth video call with a headset.
12. A photorealistic photo of a nurse giving a vaccination at a community clinic table.
13. A photorealistic photo of a nurse pushing through emergency department double doors.
14. A photorealistic photo of a nurse reviewing a patient chart on a clipboard.
15. A photorealistic photo of a nurse carrying a home-health bag up the steps of a house.
16. A photorealistic photo of a nurse in a graduation-style portrait in scrubs holding a certification.
```

Then reply `next` until all 16 exist. Save them in order as `frontend/public/images/w12/nurse/1.png` through `16.png`.

### Grid 3: Professor

Paste this setup message into a fresh ChatGPT chat first:

```
You will generate 16 photorealistic images, one per message. I will say "next" after each one. Use the numbered prompts below in order, exactly as written. Do not add or change any description of the person: no gender, age, ethnicity, or diversity wording that is not in the prompt. Candid documentary photo style, no text or logos in the image. Start with prompt 1.

1. A photorealistic photo of a professor lecturing at a whiteboard covered in diagrams in a university classroom.
2. A photorealistic photo of a professor holding office hours across a desk stacked with books.
3. A photorealistic photo of a professor leading a seminar discussion at a round table with students.
4. A photorealistic photo of a professor grading a stack of papers in a campus coffee shop.
5. A photorealistic photo of a professor in a white lab coat working at a research bench.
6. A photorealistic photo of a professor walking across a university quad carrying a leather bag.
7. A photorealistic photo of a professor presenting at an academic conference podium with a projector screen.
8. A photorealistic photo of a professor searching the stacks of a university library.
9. A photorealistic photo of a professor advising a single student in a small office.
10. A photorealistic photo of a professor writing equations on a chalkboard, mid-lecture.
11. A photorealistic photo of a professor in full academic regalia at a commencement ceremony.
12. A photorealistic photo of a professor recording an online lecture at a desk with a microphone and camera.
13. A photorealistic photo of a professor reading a journal article in an office armchair, bookshelves behind.
14. A photorealistic photo of a professor doing field work outdoors with a notebook and equipment.
15. A photorealistic photo of a professor speaking in a department faculty meeting.
16. A photorealistic photo of a professor in a portrait in front of a full bookshelf.
```

Then reply `next` until all 16 exist. Save them in order as `frontend/public/images/w12/professor/1.png` through `16.png`.

### Grid 4: Person receiving welfare

Paste this setup message into a fresh ChatGPT chat first:

```
You will generate 16 photorealistic images, one per message. I will say "next" after each one. Use the numbered prompts below in order, exactly as written. Do not add or change any description of the person: no gender, age, ethnicity, or diversity wording that is not in the prompt. Candid documentary photo style, no text or logos in the image. Start with prompt 1.

1. A photorealistic photo of a person receiving public assistance waiting in a chair at a government benefits office, holding paperwork.
2. A photorealistic photo of a person receiving public assistance filling out application forms at a public services counter.
3. A photorealistic photo of a person receiving public assistance talking with a caseworker across a desk.
4. A photorealistic photo of a person receiving public assistance holding an envelope of documents outside a social services building.
5. A photorealistic photo of a person receiving public assistance sitting in a waiting room holding a numbered ticket.
6. A photorealistic photo of a person receiving public assistance reading a benefits letter at a kitchen table.
7. A photorealistic photo of a person receiving public assistance using a public computer to apply for assistance online.
8. A photorealistic photo of a person receiving public assistance standing in line at a community food pantry.
9. A photorealistic photo of a person receiving public assistance on the phone while sorting through a folder of documents.
10. A photorealistic photo of a person receiving public assistance at a bus stop with grocery bags.
11. A photorealistic photo of a person receiving public assistance at a community assistance center intake desk.
12. A photorealistic photo of a person receiving public assistance shopping for groceries and paying with an EBT card at checkout.
13. A photorealistic photo of a person receiving public assistance with a child in a social services waiting area.
14. A photorealistic photo of a person receiving public assistance receiving a document from a clerk at a service window.
15. A photorealistic photo of a person receiving public assistance walking out of a government office holding a folder.
16. A photorealistic photo of a person receiving public assistance meeting with a nonprofit aid worker at a folding table.
```

Then reply `next` until all 16 exist. Save them in order as `frontend/public/images/w12/welfare/1.png` through `16.png`.

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
