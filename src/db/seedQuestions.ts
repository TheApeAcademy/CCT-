import type { Question } from './types'

type SeedQuestion = Omit<Question, 'id' | 'setId'>

export const starterQuestions: SeedQuestion[] = [
  // Difficulty 1 - easy
  { category: 'Bible Basics', difficulty: 1, text: 'Who built a big boat to survive the flood?', options: ['Noah', 'Moses', 'Abraham', 'David'], correctIndex: 0, funFact: 'Genesis 6-9 tells the story of Noah and the ark.' },
  { category: 'Bible Basics', difficulty: 1, text: 'Who was swallowed by a big fish?', options: ['Jonah', 'Daniel', 'Peter', 'Elijah'], correctIndex: 0, funFact: 'Jonah spent three days and three nights inside the fish!' },
  { category: 'Bible Basics', difficulty: 1, text: 'What did God create on the first day?', options: ['Light', 'Animals', 'People', 'The sun'], correctIndex: 0, funFact: 'Genesis 1:3 says "Let there be light."' },
  { category: 'Bible Basics', difficulty: 1, text: 'Who was the first man God created?', options: ['Adam', 'Cain', 'Noah', 'Seth'], correctIndex: 0 },
  { category: 'Bible Basics', difficulty: 1, text: 'Baby Jesus was born in which town?', options: ['Bethlehem', 'Nazareth', 'Jerusalem', 'Jericho'], correctIndex: 0 },
  { category: 'Bible Basics', difficulty: 1, text: 'Who is known as the "Good Shepherd"?', options: ['Jesus', 'David', 'Moses', 'John'], correctIndex: 0 },
  { category: 'Bible Basics', difficulty: 1, text: 'How many disciples did Jesus choose?', options: ['12', '7', '10', '3'], correctIndex: 0 },

  // Difficulty 2
  { category: 'Old Testament', difficulty: 2, text: 'Who led the Israelites out of Egypt?', options: ['Moses', 'Joshua', 'Aaron', 'Samuel'], correctIndex: 0, funFact: 'Moses parted the Red Sea with God\'s help!' },
  { category: 'Old Testament', difficulty: 2, text: 'Who defeated the giant Goliath?', options: ['David', 'Samson', 'Saul', 'Gideon'], correctIndex: 0, funFact: 'David used only a sling and a stone.' },
  { category: 'Old Testament', difficulty: 2, text: 'What did God give Moses on Mount Sinai?', options: ['The Ten Commandments', 'A crown', 'A sword', 'A map'], correctIndex: 0 },
  { category: 'New Testament', difficulty: 2, text: 'How many days was Jesus in the tomb before rising again?', options: ['3', '7', '1', '40'], correctIndex: 0 },
  { category: 'New Testament', difficulty: 2, text: 'What was Jesus\' first miracle?', options: ['Turning water into wine', 'Walking on water', 'Feeding 5000', 'Healing a blind man'], correctIndex: 0 },
  { category: 'Old Testament', difficulty: 2, text: 'Who had a coat of many colors?', options: ['Joseph', 'Benjamin', 'Judah', 'Reuben'], correctIndex: 0 },
  { category: 'New Testament', difficulty: 2, text: 'Who betrayed Jesus for 30 pieces of silver?', options: ['Judas', 'Peter', 'Thomas', 'John'], correctIndex: 0 },

  // Difficulty 3
  { category: 'Old Testament', difficulty: 3, text: 'How many days and nights did it rain during the flood?', options: ['40', '7', '100', '3'], correctIndex: 0 },
  { category: 'Old Testament', difficulty: 3, text: 'What was the name of Abraham\'s son of promise?', options: ['Isaac', 'Ishmael', 'Jacob', 'Esau'], correctIndex: 0 },
  { category: 'New Testament', difficulty: 3, text: 'On what mountain did Jesus give a famous sermon?', options: ['The Mount of Olives', 'Mount Sinai', 'Mount Carmel', 'Mount Ararat'], correctIndex: 0, funFact: 'Actually it\'s often just called "the mount" in the Sermon on the Mount (Matthew 5-7).' },
  { category: 'Old Testament', difficulty: 3, text: 'Who was thrown into a lions\' den?', options: ['Daniel', 'Shadrach', 'Elijah', 'Jeremiah'], correctIndex: 0 },
  { category: 'New Testament', difficulty: 3, text: 'How many loaves and fish fed the 5000?', options: ['5 loaves, 2 fish', '2 loaves, 5 fish', '7 loaves, 3 fish', '3 loaves, 7 fish'], correctIndex: 0 },
  { category: 'Old Testament', difficulty: 3, text: 'Who was the strongest man in the Bible, known for his hair?', options: ['Samson', 'Goliath', 'Saul', 'Boaz'], correctIndex: 0 },

  // Difficulty 4
  { category: 'Old Testament', difficulty: 4, text: 'What was the name of the walls that fell after the Israelites marched around them?', options: ['Jericho', 'Babylon', 'Nineveh', 'Ai'], correctIndex: 0 },
  { category: 'New Testament', difficulty: 4, text: 'Which disciple walked on water toward Jesus before he began to sink?', options: ['Peter', 'John', 'Andrew', 'James'], correctIndex: 0 },
  { category: 'Old Testament', difficulty: 4, text: 'Who was sold into slavery by his own brothers?', options: ['Joseph', 'Benjamin', 'Levi', 'Simeon'], correctIndex: 0 },
  { category: 'New Testament', difficulty: 4, text: 'On the road to where did Saul (later Paul) encounter Jesus in a bright light?', options: ['Damascus', 'Jerusalem', 'Bethlehem', 'Antioch'], correctIndex: 0 },
  { category: 'Old Testament', difficulty: 4, text: 'Who interpreted Pharaoh\'s dreams about 7 fat cows and 7 skinny cows?', options: ['Joseph', 'Daniel', 'Moses', 'Aaron'], correctIndex: 0 },

  // Difficulty 5 - hardest
  { category: 'Old Testament', difficulty: 5, text: 'What was the name of the garden where Adam and Eve first lived?', options: ['Eden', 'Gethsemane', 'Canaan', 'Goshen'], correctIndex: 0 },
  { category: 'New Testament', difficulty: 5, text: 'On which island was the apostle John when he received the Book of Revelation?', options: ['Patmos', 'Crete', 'Cyprus', 'Malta'], correctIndex: 0 },
  { category: 'Old Testament', difficulty: 5, text: 'How many years did the Israelites wander in the wilderness?', options: ['40', '25', '70', '12'], correctIndex: 0 },
  { category: 'New Testament', difficulty: 5, text: 'What was the name of the high priest\'s servant whose ear Peter cut off?', options: ['Malchus', 'Caiaphas', 'Annas', 'Barabbas'], correctIndex: 0 },
  { category: 'Old Testament', difficulty: 5, text: 'Which judge of Israel defeated the Midianites with just 300 men?', options: ['Gideon', 'Samson', 'Deborah', 'Ehud'], correctIndex: 0 },
]
