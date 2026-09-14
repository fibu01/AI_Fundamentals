// W2: one real paragraph from barry.edu, one fabricated paragraph written to
// imitate the same tone. The real text was captured verbatim on 2026-09-14.
export const W2_REAL = {
  text: 'The Monsignor William Barry Memorial Library is located in the center of the beautiful Miami Shores campus of Barry University. The Library is named in loving memory of Monsignor William Barry, one of the founders of Barry University and an inspirational figure in the Catholic Church within the Archdiocese of Miami. The extensive Library research collections include more than 950,000 physical items, over 40,000 print and on-line journal subscriptions, and several thousand on-line books and streaming video resources.',
  url: 'https://www.barry.edu/en/about/',
  captureDate: '2026-09-14',
}

export const W2_FAKE = {
  text: "The Eleanor Whitmore Science Pavilion anchors the north end of Barry University's Miami Shores campus. Completed in 1987 through a lead gift from philanthropist Eleanor Whitmore, the Pavilion houses the university's marine research laboratories and a 200-seat lecture hall. Its distinctive coral limestone facade was restored in 2009, and the building was rededicated in 2015 on the fiftieth anniversary of Whitmore's first donation to the university.",
  // Every specific below is invented. The reveal highlights these strings.
  fabricated: [
    'Eleanor Whitmore Science Pavilion',
    'Completed in 1987',
    'philanthropist Eleanor Whitmore',
    '200-seat lecture hall',
    'restored in 2009',
    'rededicated in 2015',
    'fiftieth anniversary',
  ],
}

// Randomize which side the real paragraph appears on, per session.
export const W2_REAL_SIDE = Math.random() < 0.5 ? 'left' : 'right'
