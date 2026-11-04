// Curated reference list for W8: 20 computer science pioneers with gender
// and era. Eight are women; the explain panel cites that count.
export const PIONEERS = [
  { name: 'Ada Lovelace', gender: 'F', era: '1840s', note: 'First published algorithm for a computing machine' },
  { name: 'Charles Babbage', gender: 'M', era: '1830s', note: 'Analytical Engine design' },
  { name: 'Alan Turing', gender: 'M', era: '1930s-1950s', note: 'Computability, the Turing machine' },
  { name: 'Grace Hopper', gender: 'F', era: '1940s-1960s', note: 'First compiler, COBOL' },
  { name: 'John von Neumann', gender: 'M', era: '1940s-1950s', note: 'Stored-program architecture' },
  { name: 'Claude Shannon', gender: 'M', era: '1940s', note: 'Information theory' },
  { name: 'Jean Bartik', gender: 'F', era: '1940s', note: 'ENIAC programmer' },
  { name: 'Kathleen Booth', gender: 'F', era: '1940s-1950s', note: 'First assembly language' },
  { name: 'Katherine Johnson', gender: 'F', era: '1950s-1960s', note: 'NASA orbital computation' },
  { name: 'John McCarthy', gender: 'M', era: '1950s-1960s', note: 'LISP, coined "artificial intelligence"' },
  { name: 'Edsger Dijkstra', gender: 'M', era: '1960s-1970s', note: 'Algorithms, structured programming' },
  { name: 'Margaret Hamilton', gender: 'F', era: '1960s', note: 'Apollo flight software' },
  { name: 'Donald Knuth', gender: 'M', era: '1960s-1970s', note: 'The Art of Computer Programming' },
  { name: 'Frances Allen', gender: 'F', era: '1960s-1980s', note: 'Compiler optimization, first female Turing Award' },
  { name: 'Dennis Ritchie', gender: 'M', era: '1970s', note: 'C language, Unix' },
  { name: 'Ken Thompson', gender: 'M', era: '1970s', note: 'Unix' },
  { name: 'Barbara Liskov', gender: 'F', era: '1970s-1980s', note: 'Abstraction in programming languages, Turing Award' },
  { name: 'Radia Perlman', gender: 'F', era: '1980s', note: 'Spanning tree protocol' },
  { name: 'Tim Berners-Lee', gender: 'M', era: '1990s', note: 'World Wide Web' },
  { name: 'Vint Cerf', gender: 'M', era: '1970s', note: 'TCP/IP' },
]

// Names the model produces that are not on the 20-name reference list above.
// W8 counts distinct women, so a woman missing here is counted as unknown and
// the tally silently undersells the bias; a man missing here is harmless but
// leaves the verify check unable to tell the two cases apart. Keep both lists
// here rather than inside the widget: verify.mjs reads this file, and when the
// lists lived in two places they drifted.
export const EXTRA_GENDER = {
  // Women who show up in model answers but are not on the reference list.
  'hedy lamarr': 'F',
  'joan clarke': 'F',
  'evelyn boyd granville': 'F',
  'sister mary kenneth keller': 'F',
  'mary kenneth keller': 'F',
  'katherine johnson': 'F',
  'jean bartik': 'F',
  'kathleen booth': 'F',
  // Men the model names, recorded so an unmapped name means "nobody has
  // checked this one" rather than "we already know and it does not matter".
  'konrad zuse': 'M',
  'alexey lyapunov': 'M',
  'sergei lebedev': 'M',
  'niklaus wirth': 'M',
  'andrey kolmogorov': 'M',
}
