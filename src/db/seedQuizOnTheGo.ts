import type { Question } from './types'

type SeedQuestion = Omit<Question, 'id' | 'setId'>

export interface SeedSet {
  name: string
  description: string
  questions: SeedQuestion[]
}

// Season 1 "Quiz on the Go" (Sunday 27 September 2026), plus the "Who Am I?"
// children's quiz from the same document. The correct answer is always
// listed first here - options are reshuffled every time a question is
// played (see shuffleQuestionOptions), so that never leaks into the game.
// Where the source answer key's Bible reference was off, the verse given
// here is the corrected one.

const generalBible: SeedQuestion[] = [
  { category: 'General Bible', difficulty: 1, text: "Who rolled away the stone from Jesus' tomb?", options: ['An angel', 'Soldiers', 'A disciple', 'The Holy Spirit'], correctIndex: 0, reference: 'Matthew 28:2' },
  { category: 'General Bible', difficulty: 1, text: 'How many lepers did Jesus heal at once, of whom only one came back to say thank you?', options: ['10', '9', '11', '12'], correctIndex: 0, reference: 'Luke 17:11-19' },
  { category: 'General Bible', difficulty: 2, text: 'Who placed a curse on the city of Jericho?', options: ['Joshua', 'Moses', 'Enoch', 'King Herod'], correctIndex: 0, reference: 'Joshua 6:26' },
  { category: 'General Bible', difficulty: 1, text: 'Which queen was eaten by dogs?', options: ['Jezebel', 'Deborah', 'Joan', 'Sapphira'], correctIndex: 0, reference: '2 Kings 9:30-37' },
  { category: 'General Bible', difficulty: 2, text: 'What is called the food of the angels?', options: ['Manna', 'Eggs', 'Pomegranate', 'Milk'], correctIndex: 0, funFact: 'Psalm 78:25 says "Man did eat angels\' food" - speaking of the manna God sent from heaven.', reference: 'Psalm 78:24-25' },
  { category: 'General Bible', difficulty: 2, text: 'Naaman, the commander of the Syrian army, was cured of leprosy in which river?', options: ['Jordan', 'Nile', 'Abana', 'Pharpar'], correctIndex: 0, funFact: 'Naaman first complained that the rivers Abana and Pharpar back home were better!', reference: '2 Kings 5:12-14' },
  { category: 'General Bible', difficulty: 3, text: 'Where was Saul installed as the king of Israel?', options: ['Gilgal', 'Horeb', 'Gibeon', 'Jerusalem'], correctIndex: 0, reference: '1 Samuel 11:15' },
  { category: 'General Bible', difficulty: 3, text: 'Which of the following fathered Methuselah?', options: ['Enoch', 'Silas', 'Adam', 'Gad'], correctIndex: 0, reference: 'Genesis 5:21; 1 Chronicles 1:3' },
  { category: 'General Bible', difficulty: 3, text: 'Who planned to kill Lazarus after he was raised from the dead?', options: ['The High Priest (chief priests)', 'Nehemiah', 'A scribe', 'Jonah'], correctIndex: 0, reference: 'John 12:10' },
  { category: 'General Bible', difficulty: 4, text: 'What vice (evil) were the people of Crete known for?', options: ['Lying', 'Idol worship', 'Kidnapping', 'Idleness'], correctIndex: 0, funFact: 'Paul quotes one of their own prophets: "The Cretians are alway liars."', reference: 'Titus 1:12' },
  { category: 'General Bible', difficulty: 3, text: 'What kind of doctrine does Paul talk about in the book of Titus?', options: ['Sound doctrine', 'Fair doctrine', 'Special doctrine', 'Junk doctrine'], correctIndex: 0, reference: 'Titus 2:1' },
  { category: 'General Bible', difficulty: 4, text: 'What vice (evil) did Paul tell Titus to advise older women to avoid?', options: ['Gossip (false accusing)', 'Over-eating', 'Hatred', 'Anger'], correctIndex: 0, reference: 'Titus 2:3' },
  { category: 'General Bible', difficulty: 2, text: 'Which of these women carried two nations in her womb?', options: ['Rebekah', 'Ruth', 'Naomi', 'Deborah'], correctIndex: 0, funFact: 'The two nations were her twins, Jacob and Esau.', reference: 'Genesis 25:23' },
  { category: 'General Bible', difficulty: 5, text: 'Where did Paul tell Titus he had decided to spend the winter?', options: ['Nicopolis', 'Tarshish', 'Decapolis', 'Rome'], correctIndex: 0, reference: 'Titus 3:12' },
  { category: 'General Bible', difficulty: 4, text: 'Which of these Bible characters blessed Pharaoh?', options: ['Jacob', 'Abimelech', 'Ahimelech', 'Isaac'], correctIndex: 0, reference: 'Genesis 47:7-10' },
  { category: 'General Bible', difficulty: 5, text: 'Whom did Paul have in mind to send to Titus?', options: ['Artemas or Tychicus', 'Barnabas or Luke', 'Aquila or Priscilla', 'Onesimus'], correctIndex: 0, reference: 'Titus 3:12' },
  { category: 'General Bible', difficulty: 2, text: 'Who was the father of Methuselah?', options: ['Enoch', 'Cain', 'Abel', 'Adam'], correctIndex: 0, reference: 'Genesis 5:21' },
  { category: 'General Bible', difficulty: 3, text: 'Who designed the plan for the temple built by Solomon?', options: ['David', 'God', 'Jesse', 'Judah'], correctIndex: 0, funFact: 'David gave Solomon the pattern of the temple, which he said the Lord made him understand in writing.', reference: '1 Chronicles 28:11-19' },
  { category: 'General Bible', difficulty: 5, text: 'Which of these had eighty-eight children?', options: ['King Rehoboam', 'Gideon', 'Jael', 'Uzzah'], correctIndex: 0, funFact: 'Rehoboam had 28 sons and 60 daughters.', reference: '2 Chronicles 11:21' },
  { category: 'General Bible', difficulty: 1, text: 'In which city were the followers of Jesus first called Christians?', options: ['Antioch', 'Samaria', 'Babylon', 'Rome'], correctIndex: 0, reference: 'Acts 11:26' },
  { category: 'General Bible', difficulty: 4, text: 'What were the Egyptians doing while the children of Israel were leaving Egypt?', options: ['Burying their firstborn', 'Shooting', 'Praying', 'Waving and cheering'], correctIndex: 0, reference: 'Numbers 33:3-4' },
  { category: 'General Bible', difficulty: 1, text: 'Which of these statements is correct?', options: ['Light and darkness are opposites', 'Light and darkness are equal', 'Darkness is heavier than light', 'None of the above'], correctIndex: 0, reference: 'Genesis 1:4; 1 John 1:5' },
  { category: 'General Bible', difficulty: 4, text: 'How many times did David have the chance to kill Saul but refuse?', options: ['2', '5', '4', '3'], correctIndex: 0, funFact: 'Once in a cave at En Gedi, and once in Saul\'s camp while he slept.', reference: '1 Samuel 24:1-7; 26:7-12' },
  { category: 'General Bible', difficulty: 3, text: 'Which army came to attack the Israelites after they left Egypt?', options: ['Amalekites', 'Hittites', 'Perizzites', 'Jebusites'], correctIndex: 0, reference: 'Exodus 17:8' },
  { category: 'General Bible', difficulty: 3, text: 'How many brothers did Jesus have while on earth?', options: ['4', '3', '2', '1'], correctIndex: 0, funFact: 'James, Joseph (Joses), Simon and Judas.', reference: 'Matthew 13:55' },
]

const bookOfJoshua: SeedQuestion[] = [
  { category: 'Book of Joshua', difficulty: 1, text: 'Who succeeded Moses as the leader of the Israelites?', options: ['Joshua', 'Caleb', 'Eleazar', 'Phinehas'], correctIndex: 0, reference: 'Joshua 1:1-2' },
  { category: 'Book of Joshua', difficulty: 1, text: 'What was the first city the Israelites conquered in the Promised Land?', options: ['Jericho', 'Ai', 'Hazor', 'Gibeon'], correctIndex: 0, reference: 'Joshua 6' },
  { category: 'Book of Joshua', difficulty: 3, text: 'Who were the spies sent to Jericho?', options: ['Two unnamed men', 'Joshua and Caleb', 'Joshua and Eleazar', 'Phinehas and Eleazar'], correctIndex: 0, reference: 'Joshua 2:1' },
  { category: 'Book of Joshua', difficulty: 2, text: 'What was the sign for the spies to look for in Jericho?', options: ['A scarlet cord', 'A red rope', 'A white flag', 'A blue ribbon'], correctIndex: 0, reference: 'Joshua 2:18-21' },
  { category: 'Book of Joshua', difficulty: 1, text: 'Who helped the spies in Jericho?', options: ['Rahab', 'Achan', 'Caleb', 'Eleazar'], correctIndex: 0, reference: 'Joshua 2:1-6' },
  { category: 'Book of Joshua', difficulty: 3, text: 'How did the Israelites march around Jericho on the last day?', options: ['Around the city seven times on the seventh day', 'Once a day for six days', 'Seven times on the first day', 'Once a day for seven days'], correctIndex: 0, funFact: 'They marched once a day for six days, then seven times on the seventh day.', reference: 'Joshua 6:3-4, 15' },
  { category: 'Book of Joshua', difficulty: 1, text: 'What happened to the walls of Jericho?', options: ['They fell down flat', 'They were breached by the Israelites', 'They were destroyed by an earthquake', 'They remained standing'], correctIndex: 0, reference: 'Joshua 6:20' },
  { category: 'Book of Joshua', difficulty: 4, text: 'Who was the king of Ai?', options: ['A king whose name is not mentioned', 'Adoni-zedek', 'Jabin', 'Joshua'], correctIndex: 0, reference: 'Joshua 8:23, 29' },
  { category: 'Book of Joshua', difficulty: 2, text: "What was the reason for the Israelites' defeat at Ai?", options: ["Achan's sin", 'Lack of faith', 'Poor strategy', 'Lack of preparation'], correctIndex: 0, reference: 'Joshua 7:1-12' },
  { category: 'Book of Joshua', difficulty: 2, text: 'How was Achan punished for his sin?', options: ['He was stoned to death', 'He was banished from the camp', 'He was given a warning', 'He was forgiven'], correctIndex: 0, reference: 'Joshua 7:25' },
  { category: 'Book of Joshua', difficulty: 4, text: 'Who led the southern coalition against the Israelites?', options: ['Adoni-zedek', 'Jabin', 'Joshua', 'Caleb'], correctIndex: 0, funFact: 'Adoni-zedek was king of Jerusalem - he joined four other kings against Gibeon.', reference: 'Joshua 10:1-5' },
  { category: 'Book of Joshua', difficulty: 4, text: 'Who led the northern coalition against the Israelites?', options: ['Jabin', 'Adoni-zedek', 'Joshua', 'Caleb'], correctIndex: 0, funFact: 'Jabin was king of Hazor.', reference: 'Joshua 11:1-5' },
  { category: 'Book of Joshua', difficulty: 3, text: 'How did the Israelites defeat the southern and northern coalitions?', options: ['Through military might and miraculous intervention', 'Through diplomacy', 'Through military might only', 'Through miraculous intervention only'], correctIndex: 0, funFact: 'God sent hailstones and made the sun stand still while Israel fought.', reference: 'Joshua 10:11-14; 11:6-8' },
  { category: 'Book of Joshua', difficulty: 5, text: 'What was the extent of the land conquered by the Israelites?', options: ['From the wilderness to the Euphrates River', 'From the wilderness to Lebanon', 'From the Jordan River to the Mediterranean Sea', 'From Dan to Beersheba'], correctIndex: 0, funFact: 'The land is described in Joshua 11:16-23 and 12:7-24.', reference: 'Joshua 1:4; 11:16-23' },
  { category: 'Book of Joshua', difficulty: 2, text: 'How was the land divided among the Israelites?', options: ['By lot', "By Joshua's decision", "By the people's choice", "By the elders' decision"], correctIndex: 0, reference: 'Joshua 14:1-2' },
  { category: 'Book of Joshua', difficulty: 5, text: 'What cities were given to the Levites?', options: ['All of the above', 'Cities of refuge', 'Cities in the wilderness', 'Cities in the mountains'], correctIndex: 0, funFact: 'The Levites received 48 cities, 6 of which were cities of refuge.', reference: 'Joshua 21:41' },
  { category: 'Book of Joshua', difficulty: 3, text: 'Who was the last leader of the Israelites mentioned in the book of Joshua?', options: ['Joshua', 'Caleb', 'Eleazar', 'Phinehas'], correctIndex: 0, reference: 'Joshua 24:29' },
  { category: 'Book of Joshua', difficulty: 2, text: "What was Joshua's final message to the Israelites?", options: ['Serve the Lord and obey His commands', 'Worship idols and follow other gods', 'Make alliances with the nations around them', 'Settle in the wilderness'], correctIndex: 0, funFact: '"As for me and my house, we will serve the LORD."', reference: 'Joshua 24:14-15' },
  { category: 'Book of Joshua', difficulty: 5, text: 'Where was Joshua buried?', options: ['Timnath-serah', 'Shechem', 'Shiloh', 'Hebron'], correctIndex: 0, reference: 'Joshua 24:30' },
  { category: 'Book of Joshua', difficulty: 1, text: "Who was Joshua's father?", options: ['Nun', 'Shem', 'Eleazar', 'Melchizedek'], correctIndex: 0, reference: 'Joshua 1:1' },
]

const whoAmI: SeedQuestion[] = [
  { category: 'Who Am I?', difficulty: 3, text: "I am the only one of the Lord's prophets left. Who am I?", options: ['Elijah', 'Elisha', 'Obadiah', 'Micaiah'], correctIndex: 0, reference: '1 Kings 18:22' },
  { category: 'Who Am I?', difficulty: 1, text: 'I am the first king of Israel. Who am I?', options: ['Saul', 'David', 'Samuel', 'Solomon'], correctIndex: 0, reference: '1 Samuel 10:24-26' },
  { category: 'Who Am I?', difficulty: 5, text: 'I am the father of King Ahab. Who am I?', options: ['Omri', 'Jehu', 'Jeroboam', 'Ahaziah'], correctIndex: 0, reference: '1 Kings 16:29' },
  { category: 'Who Am I?', difficulty: 2, text: "Shem, Ham, and I are Noah's sons. Who am I?", options: ['Japheth', 'Seth', 'Enoch', 'Lamech'], correctIndex: 0, reference: 'Genesis 6:10' },
  { category: 'Who Am I?', difficulty: 2, text: 'I pleaded with the Lord to spare my nephew Lot and his family from the destruction of Sodom and Gomorrah. Who am I?', options: ['Abraham', 'Isaac', 'Moses', 'Melchizedek'], correctIndex: 0, reference: 'Genesis 18:16-33' },
  { category: 'Who Am I?', difficulty: 2, text: "I am Jacob's first wife. Who am I?", options: ['Leah', 'Rachel', 'Bilhah', 'Zilpah'], correctIndex: 0, reference: 'Genesis 29:21-23' },
  { category: 'Who Am I?', difficulty: 5, text: 'I am the bronze serpent raised by Moses in the desert. What am I called?', options: ['Nehushtan', 'Leviathan', 'Behemoth', 'The golden calf'], correctIndex: 0, funFact: 'King Hezekiah later broke it in pieces because the people had started burning incense to it.', reference: '2 Kings 18:4' },
  { category: 'Who Am I?', difficulty: 3, text: "I was hired to curse the children of Israel but I couldn't do it. Who am I?", options: ['Balaam', 'Balak', 'Korah', 'Bildad'], correctIndex: 0, reference: 'Numbers 22' },
  { category: 'Who Am I?', difficulty: 2, text: 'Samuel asked, "Are these all the sons you have?" "There is still the youngest," Jesse replied, "but he is tending the sheep." Who am I?', options: ['David', 'Eliab', 'Abinadab', 'Solomon'], correctIndex: 0, reference: '1 Samuel 16:11' },
  { category: 'Who Am I?', difficulty: 1, text: 'I asked God for wisdom. Who am I?', options: ['Solomon', 'David', 'Daniel', 'Hezekiah'], correctIndex: 0, reference: '1 Kings 3:9' },
  { category: 'Who Am I?', difficulty: 3, text: 'I saw something like a great sheet filled with animals coming down from heaven. Who am I?', options: ['Peter', 'John', 'Paul', 'Cornelius'], correctIndex: 0, reference: 'Acts 10:11-13' },
  { category: 'Who Am I?', difficulty: 4, text: 'I am a book of the Bible. Written in me are the words: "Come to me, all who labor and are heavy laden, and I will give you rest." Who am I?', options: ['Matthew', 'John', 'Psalms', 'Romans'], correctIndex: 0, reference: 'Matthew 11:28' },
  { category: 'Who Am I?', difficulty: 1, text: 'I am the last plague of Egypt. What am I?', options: ['Death of the firstborn', 'Darkness', 'Locusts', 'Hail'], correctIndex: 0, reference: 'Exodus 11:4-5' },
  { category: 'Who Am I?', difficulty: 4, text: 'Into me, God breathed the breath of life. What am I?', options: ['The nose (nostrils)', 'The mouth', 'The ears', 'The heart'], correctIndex: 0, funFact: '"The LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life."', reference: 'Genesis 2:7' },
  { category: 'Who Am I?', difficulty: 3, text: 'I drove the tent peg through his temple into the ground, and he died. Who am I?', options: ['Jael', 'Deborah', 'Delilah', 'Rahab'], correctIndex: 0, funFact: 'The man was Sisera, commander of the Canaanite army.', reference: 'Judges 4:18-21' },
  { category: 'Who Am I?', difficulty: 2, text: 'I am a city. In me, the disciples were called Christians for the first time. Who am I?', options: ['Antioch', 'Jerusalem', 'Rome', 'Ephesus'], correctIndex: 0, reference: 'Acts 11:26' },
  { category: 'Who Am I?', difficulty: 2, text: 'Paul says I am greater than any other gift the church may have. What am I?', options: ['Love', 'Faith', 'Hope', 'Prophecy'], correctIndex: 0, reference: '1 Corinthians 13:1-2, 13' },
  { category: 'Who Am I?', difficulty: 1, text: "I am Joshua's father. Who am I?", options: ['Nun', 'Caleb', 'Eleazar', 'Jephunneh'], correctIndex: 0, reference: 'Joshua 1:1' },
  { category: 'Who Am I?', difficulty: 5, text: 'I was one of Israel\'s judges. I had 30 sons, who rode on 30 donkeys and had 30 cities. Who am I?', options: ['Jair', 'Gideon', 'Jephthah', 'Tola'], correctIndex: 0, reference: 'Judges 10:3-4' },
  { category: 'Who Am I?', difficulty: 4, text: 'I was commander of the army of the king of Syria, and I was healed of leprosy by the prophet Elisha. Who am I?', options: ['Naaman', 'Nebuchadnezzar', 'Ben-Hadad', 'Hazael'], correctIndex: 0, reference: '2 Kings 5:1-14' },
]

export const quizOnTheGoSets: SeedSet[] = [
  {
    name: 'Quiz on the Go: General Bible (27 Sep 2026)',
    description: 'Season 1 Quiz on the Go - 25 general Bible questions for Sunday 27 September 2026.',
    questions: generalBible,
  },
  {
    name: 'Quiz on the Go: Book of Joshua (27 Sep 2026)',
    description: 'Season 1 Quiz on the Go - 20 questions from the book of Joshua for Sunday 27 September 2026.',
    questions: bookOfJoshua,
  },
  {
    name: 'Who Am I? What Am I?',
    description: '20 "Who am I?" Bible riddles for children - each clue describes a person, place or thing.',
    questions: whoAmI,
  },
]
