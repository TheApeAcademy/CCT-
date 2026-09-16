import type { JourneyBook, JourneyUnit } from './bibleJourneyTypes'

// Genesis: the first book of the Bible Journey. More books get added the
// same way, one at a time (Exodus next, then onward) - see BibleJourney.tsx
// for how a book with no units yet shows up as "coming soon" on the map.
//
// Each lesson is a real ~10-minute daily session: however many
// read-a-few-pages-then-check sections its story actually needs (never a
// fixed count), then a final mastery round sized to how much the lesson
// actually covers (never more than 10, never padded up to 10 either).
// Every mastery question must eventually be answered right - a wrong
// answer shows its explanation and the question is requeued rather than
// skipped.

const creation: JourneyUnit = {
  key: 'creation',
  title: 'Creation',
  kind: 'story',
  emoji: '🌍',
  lessons: [
    {
      key: 'genesis-creation',
      title: 'Creation Week',
      reference: 'Genesis 1:1-2:3',
      sections: [
        {
          cards: [
            { emoji: '🌌', text: 'Before anything else existed, God was already there. The Bible starts with six simple words: "In the beginning God created the heavens and the earth."', ref: 'Genesis 1:1' },
            { emoji: '💡', text: 'The earth was dark and empty, like a room with the lights off. On Day 1, God said "Let there be light" - and light appeared, just like that. No tools, no waiting. Just His word.', ref: 'Genesis 1:2-5' },
            { emoji: '🌊', text: 'On Day 2, God separated the sky from the waters. On Day 3, He gathered the water into oceans and made dry land appear, then filled it with trees, plants, and flowers.', ref: 'Genesis 1:6-13' },
          ],
          checkQuestions: [
            { question: 'How did God make light appear?', options: ['He flipped a switch', 'He spoke, and it happened', 'He used fire', 'It was already there'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '☀️', text: 'On Day 4, God hung the sun in the sky to light the day, the moon to light the night, and scattered the stars everywhere. He made them to mark days, seasons, and years.', ref: 'Genesis 1:14-19' },
            { emoji: '🐟', text: 'On Day 5, God filled the oceans with fish of every shape and size, and filled the sky with birds. Whales, tiny fish, eagles, sparrows - all made that day.', ref: 'Genesis 1:20-23' },
            { emoji: '🦁', text: 'On Day 6, God made every land animal: lions, elephants, ants, giraffes. Every single one was His idea first. He looked at all of it and called it good.', ref: 'Genesis 1:24-25' },
          ],
          checkQuestions: [
            { question: 'What did God make on Day 5?', options: ['Land animals', 'The sun and moon', 'Fish and birds', 'People'], correctIndex: 2 },
          ],
        },
        {
          cards: [
            { emoji: '🧑‍🤝‍🧑', text: 'On Day 6, God did something different. He made people - not just another animal, but someone made "in His own image," to be like Him in a special way.', ref: 'Genesis 1:26-27' },
            { emoji: '🌳', text: 'God gave Adam and Eve a job: take care of the whole earth, the animals, and each other. He trusted them with something huge, right from the start.', ref: 'Genesis 1:28' },
            { emoji: '🛌', text: 'On Day 7, God rested. Not because He was tired - God never gets tired - but to show that rest matters. He made the whole world in six days and then paused.', ref: 'Genesis 2:1-3' },
          ],
          checkQuestions: [
            { question: 'What makes people different from the animals God made?', options: ['People are bigger', "People are made in God's own image", 'People came first', 'People can fly'], correctIndex: 1 },
          ],
        },
      ],
      masteryQuestions: [
        { question: 'What are the very first words of the Bible?', options: ['"Once upon a time"', '"Let there be light"', '"In the beginning God created the heavens and the earth"', '"God rested"'], correctIndex: 2, explanation: 'Genesis 1:1 opens the whole Bible with exactly that line.' },
        { question: 'What did God separate on Day 2?', options: ['Land and sea', 'The sky and the waters', 'Day and night only', 'Nothing at all'], correctIndex: 1, explanation: 'Genesis 1:6-8 describes God separating the sky from the waters below.' },
        { question: 'Which book of the Bible is this story found in?', options: ['Exodus', 'Psalms', 'Genesis', 'Matthew'], correctIndex: 2, explanation: 'Genesis is the very first book of the Bible, and this is its opening story.' },
        { question: 'What did God put in the sky on Day 4?', options: ['Birds', 'The sun, moon, and stars', 'Clouds only', 'Nothing yet'], correctIndex: 1, explanation: 'Genesis 1:16 says God made the sun, moon, and stars on Day 4.' },
        { question: 'What did God make on Day 6?', options: ['Land animals', 'Stars', 'Oceans', 'Light'], correctIndex: 0, explanation: 'Lions, elephants, ants, and giraffes were all made on Day 6.' },
        { question: 'What did God say about everything He made?', options: ['It was a mistake', 'It was good', 'It was boring', 'It was unfinished'], correctIndex: 1, explanation: 'Genesis 1:25 says God saw that it was good.' },
        { question: 'What did God make that was different from every animal?', options: ['A bigger animal', 'People, made in His own image', 'A robot', 'Nothing new at all'], correctIndex: 1, explanation: "Genesis 1:27 says people alone were made in God's own image." },
        { question: 'What did God do on Day 7?', options: ['Made more animals', 'Rested', 'Flooded the earth', 'Created the sun'], correctIndex: 1, explanation: 'After six days of creating, God rested on the seventh.' },
        { question: '"Made in God\'s image" means what?', options: ['People are exactly the same as God', 'People are made to be like Him in a special way', 'It means nothing', 'People are robots'], correctIndex: 1, explanation: 'It means people reflect God in a unique way no animal does.' },
        { question: "What's the big takeaway from Creation Week?", options: ['God made everything on purpose, including people', 'The world made itself', 'God is still creating new planets today', 'None of it matters'], correctIndex: 0, explanation: "Every day of creation, including people, happened on purpose by God's design." },
      ],
    },
  ],
}

const adamAndEve: JourneyUnit = {
  key: 'adam-and-eve',
  title: 'Adam and Eve',
  kind: 'story',
  emoji: '🌳',
  lessons: [
    {
      key: 'genesis-adam-eve',
      title: 'The Garden and the Fall',
      reference: 'Genesis 2:8-3:24',
      image: '/journey/adam-eve-garden-home.jpg',
      sections: [
        {
          cards: [
            { emoji: '🏡', text: 'God planted a beautiful garden called Eden and put Adam right in the middle of it, with every tree and fruit he could want - free to enjoy all of it.', ref: 'Genesis 2:8-9' },
            { emoji: '🚫', text: 'There was one rule: don\'t eat from the tree of the knowledge of good and evil. Just one. Out of an entire garden full of good things, God only said no to that one tree.', ref: 'Genesis 2:16-17' },
            { emoji: '👩', text: 'God saw that Adam needed a companion, so He made Eve. The two of them lived together in the garden, walking and talking with God like friends.', ref: 'Genesis 2:18-25' },
          ],
          checkQuestions: [
            { question: 'How many trees in the garden were off-limits to Adam and Eve?', options: ['All of them', 'Ten', 'Just one', 'None'], correctIndex: 2 },
          ],
        },
        {
          cards: [
            { emoji: '🐍', text: 'A crafty serpent asked Eve, "Did God really say you can\'t eat from any tree?" - twisting the one small rule into something bigger, and planting doubt.', ref: 'Genesis 3:1-5' },
            { emoji: '🍎', text: 'Eve ate the fruit and gave some to Adam, and he ate too. Right away, everything changed - they felt ashamed and hid from God for the first time ever.', ref: 'Genesis 3:6-8', },
            { emoji: '💔', text: 'Their choice had real consequences: they had to leave the garden. But even then, God still cared for them and promised that one day, things would be made right again.', ref: 'Genesis 3:15-24' },
          ],
          image: '/journey/adam-eve-first-sin.jpg',
          checkQuestions: [
            { question: 'What did the serpent do to Eve?', options: ['Gave her a gift', "Twisted God's words and planted doubt", 'Told her the truth kindly', 'Ran away'], correctIndex: 1 },
          ],
        },
      ],
      masteryQuestions: [
        { question: 'What was the name of the garden God made?', options: ['Canaan', 'Eden', 'Egypt', 'Nazareth'], correctIndex: 1, explanation: 'God planted the Garden of Eden and placed Adam in it.' },
        { question: 'What was the one rule God gave?', options: ["Don't eat from the tree of the knowledge of good and evil", 'Never sleep in the garden', "Don't talk to animals", 'Never leave Eden'], correctIndex: 0, explanation: 'That single tree was the only thing off-limits.' },
        { question: 'Why did God make Eve?', options: ['Adam asked for a servant', 'Adam needed a companion', 'The animals wanted a friend', 'No reason is given'], correctIndex: 1, explanation: 'God saw Adam needed someone to share life with.' },
        { question: 'What does this story show about how God treats people?', options: ['He is generous and gives real freedom', 'He gives no freedom at all', 'He hides everything from people', 'He never explains anything'], correctIndex: 0, explanation: 'God gave Adam an entire garden of freedom, with just one boundary.' },
        { question: 'How did the serpent twist God\'s rule?', options: ['He made it sound like a bigger restriction than it was', 'He said it kindly', 'He gave a gift instead', 'He obeyed it himself'], correctIndex: 0, explanation: 'The serpent exaggerated the one rule into "any tree" to plant doubt.' },
        { question: 'What happened right after Adam and Eve ate the fruit?', options: ['Nothing changed', 'They felt ashamed and hid', 'They became invisible', 'God ignored them'], correctIndex: 1, explanation: 'Shame and hiding from God happened immediately.' },
        { question: 'What real consequence did Adam and Eve face?', options: ['Nothing happened to them', 'They had to leave the garden', 'They became animals', 'They were given more trees'], correctIndex: 1, explanation: 'Their sin had a real, lasting consequence: leaving Eden.' },
        { question: 'What is the overall lesson of Genesis 3?', options: ['Sin has real consequences, but God still cares', 'Nothing bad ever happens from sin', 'God abandoned Adam and Eve forever', 'Snakes are dangerous animals'], correctIndex: 0, explanation: "The Fall shows both the seriousness of sin and God's continued care." },
      ],
    },
  ],
}

const cainAndAbel: JourneyUnit = {
  key: 'cain-and-abel',
  title: 'Cain and Abel',
  kind: 'story',
  emoji: '🐑',
  lessons: [
    {
      key: 'genesis-cain-abel',
      title: 'Two Brothers, Two Offerings',
      reference: 'Genesis 4:1-16',
      image: '/journey/cain-abel-offerings.jpg',
      sections: [
        {
          cards: [
            { emoji: '👨‍👦', text: "Adam and Eve's sons Cain and Abel each brought an offering to God. Abel brought his best; Cain didn't bring his best - and God noticed the difference.", ref: 'Genesis 4:1-5' },
            { emoji: '😠', text: "Cain got angry that Abel's offering pleased God and his didn't. God warned Cain to deal with that anger before it controlled him - but Cain didn't listen.", ref: 'Genesis 4:6-7' },
            { emoji: '⚰️', text: "Cain let his anger take over and hurt his brother. It was the first time jealousy led to something that couldn't be undone - a hard lesson about where anger can lead.", ref: 'Genesis 4:8-16' },
          ],
          checkQuestions: [
            { question: 'Why did God warn Cain?', options: ['Because Cain was hungry', 'Because his anger was about to control him', 'Because Abel was in danger from an animal', 'Because Cain was leaving home'], correctIndex: 1 },
          ],
        },
      ],
      masteryQuestions: [
        { question: 'Who were Cain and Abel?', options: ["Adam and Eve's sons", 'Strangers', "Noah's sons", "Abraham's servants"], correctIndex: 0, explanation: 'They were the sons of Adam and Eve.' },
        { question: 'What made God notice a difference between the two offerings?', options: ['Abel brought his best', 'Cain brought more', 'They looked the same', 'Neither brought anything'], correctIndex: 0, explanation: "Abel's offering was his best; Cain's wasn't." },
        { question: 'What did God warn Cain to do?', options: ['Bring a bigger offering', 'Deal with his anger before it controlled him', 'Leave home', 'Ignore Abel'], correctIndex: 1, explanation: 'God gave Cain a chance to master his anger before it went further.' },
        { question: "What did Cain's anger lead him to do?", options: ['Apologize to Abel', 'Hurt his brother', 'Bring a better offering', 'Leave peacefully'], correctIndex: 1, explanation: 'His unchecked anger led to something that could not be undone.' },
        { question: 'What is this story a hard lesson about?', options: ['Farming', 'Where jealousy and anger can lead', 'Cooking food', 'Building houses'], correctIndex: 1, explanation: 'It shows how unchecked jealousy and anger can lead somewhere serious.' },
      ],
    },
  ],
}

const noah: JourneyUnit = {
  key: 'noah',
  title: 'Noah and the Flood',
  kind: 'story',
  emoji: '🚢',
  lessons: [
    {
      key: 'genesis-noah',
      title: 'Noah and the Flood',
      reference: 'Genesis 6:1-9:17',
      sections: [
        {
          cards: [
            { emoji: '😔', text: 'Many years after Adam and Eve, the world had grown full of people - and full of wrongdoing. God looked at the earth and was deeply grieved by what He saw.', ref: 'Genesis 6:5-6' },
            { emoji: '⭐', text: 'But one man stood out: Noah. The Bible says Noah "found favor in the eyes of the Lord" - he tried to live rightly even when almost no one around him did.', ref: 'Genesis 6:8-9' },
            { emoji: '🗣️', text: 'God told Noah His plan: a flood would come to wash the earth clean, but Noah and his family would be kept safe. Noah just had to trust and obey.', ref: 'Genesis 6:13-18' },
          ],
          checkQuestions: [
            { question: 'What made Noah stand out from everyone else?', options: ['He was the tallest', 'He found favor with God by living rightly', 'He was the richest', 'He was the oldest'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '🔨', text: 'God gave Noah exact instructions for a massive boat called an ark, built from cypress wood, coated in tar, with rooms inside for his family and every kind of animal.', ref: 'Genesis 6:14-16' },
            { emoji: '🐘', text: "Noah was told to bring two of every kind of animal on board - male and female - so life could continue after the flood. That's a lot of animals to gather.", ref: 'Genesis 6:19-20' },
            { emoji: '⏳', text: 'It likely took Noah decades to build the ark, with no rain in sight and neighbors probably laughing at him the whole time. Noah kept building anyway, exactly as God said.', ref: 'Genesis 6:22' },
          ],
          image: '/journey/noah-building-ark.jpg',
          checkQuestions: [
            { question: 'How many of each kind of animal did Noah bring on the ark?', options: ['One', 'Two', 'Ten', 'A hundred'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '🌧️', text: "Once the animals and Noah's family were safely inside, God shut the door Himself. Rain fell for 40 days and 40 nights, and water covered the whole earth.", ref: 'Genesis 7:11-12' },
            { emoji: '🌊', text: "The water rose so high it covered even the tallest mountains. Everyone and everything outside the ark was gone - but Noah's family and the animals stayed safe inside.", ref: 'Genesis 7:17-23' },
            { emoji: '🕊️', text: 'The ark floated for months. Noah eventually sent out a dove to check for dry land, and when it came back with an olive leaf, he knew the water was going down.', ref: 'Genesis 8:6-12' },
          ],
          checkQuestions: [
            { question: 'How long did the rain fall?', options: ['One day', '7 days', '40 days and 40 nights', 'A whole year'], correctIndex: 2 },
          ],
        },
        {
          cards: [
            { emoji: '🐾', text: 'When the water finally dried up, Noah, his family, and every animal walked out onto dry land again. The first thing Noah did was build an altar and thank God.', ref: 'Genesis 8:15-20' },
            { emoji: '🌈', text: 'God made a promise - a covenant - that He would never flood the whole earth again. As a sign of that promise, He set a rainbow in the sky.', ref: 'Genesis 9:11-13' },
            { emoji: '🤝', text: "That rainbow wasn't just pretty - it was God's reminder to every generation after Noah, including us, that He keeps His promises no matter how much time passes.", ref: 'Genesis 9:16-17' },
          ],
          image: '/journey/noah-dove-olive-branch.jpg',
          checkQuestions: [
            { question: 'What sign did God put in the sky as a promise?', options: ['A star', 'A rainbow', 'A cloud shaped like a boat', 'Lightning'], correctIndex: 1 },
          ],
        },
      ],
      masteryQuestions: [
        { question: "What had the world grown full of by Noah's time?", options: ['Wrongdoing', 'Peace', 'Wealth', 'Music'], correctIndex: 0, explanation: 'Genesis 6:5 describes how full of wrongdoing the earth had become.' },
        { question: 'Who stood out as different from everyone else?', options: ['Noah', "Noah's neighbors", 'Everyone equally', 'No one'], correctIndex: 0, explanation: 'Noah tried to live rightly even surrounded by wrongdoing.' },
        { question: 'What was the ark made of?', options: ['Stone', 'Cypress wood', 'Metal', 'Ice'], correctIndex: 1, explanation: 'God instructed Noah to build the ark from cypress wood.' },
        { question: 'How many of each animal did Noah bring aboard?', options: ['One', 'Two, male and female', 'Ten', 'A hundred'], correctIndex: 1, explanation: 'Two of each kind ensured life could continue after the flood.' },
        { question: 'Who shut the door of the ark?', options: ['Noah', 'God Himself', 'One of the animals', 'Nobody, it locked on its own'], correctIndex: 1, explanation: 'God Himself shut the door once everyone was safely inside.' },
        { question: 'How long did the rain fall?', options: ['One day', '7 days', '40 days and 40 nights', 'A whole year'], correctIndex: 2, explanation: 'The rain fell continuously for 40 days and 40 nights.' },
        { question: 'What did the dove bring back to show land was near?', options: ['A fish', 'A rock', 'An olive leaf', 'Nothing'], correctIndex: 2, explanation: 'The olive leaf showed that dry land and plants were reappearing.' },
        { question: 'What did God promise never to do again?', options: ['Flood the whole earth', 'Send rain at all', 'Make more animals', 'Talk to people'], correctIndex: 0, explanation: 'God promised never again to flood the entire earth.' },
        { question: 'What sign did God give as a reminder of that promise?', options: ['A star', 'A rainbow', 'A mountain', 'A tree'], correctIndex: 1, explanation: 'The rainbow was set in the sky as the sign of the covenant.' },
        { question: 'What is the biggest lesson of this whole Noah story?', options: ['God keeps His promises', 'Rain is dangerous', 'Boats are useful', "Animals can't swim"], correctIndex: 0, explanation: "From the flood to the rainbow, the story shows God's faithfulness to His word." },
      ],
    },
  ],
}

const towerOfBabel: JourneyUnit = {
  key: 'tower-of-babel',
  title: 'The Tower of Babel',
  kind: 'story',
  emoji: '🏗️',
  lessons: [
    {
      key: 'genesis-babel',
      title: 'One Language, One Tower',
      reference: 'Genesis 11:1-9',
      image: '/journey/tower-of-babel.jpg',
      sections: [
        {
          cards: [
            { emoji: '🗣️', text: 'After the flood, everyone on earth spoke the same language. A group of people decided to build a massive tower "to reach the heavens" and make a name for themselves.', ref: 'Genesis 11:1-4' },
            { emoji: '🏙️', text: "The problem wasn't the building itself - it was the reason behind it: pride, and trying to prove they didn't need God at all.", ref: 'Genesis 11:4' },
            { emoji: '🌍', text: "God confused their language so they could no longer understand each other, and they scattered across the earth. That's part of how so many different languages began.", ref: 'Genesis 11:7-9' },
          ],
          checkQuestions: [
            { question: 'What was the real problem with the tower?', options: ['It was too short', 'Pride, and trying to not need God', 'It was made of the wrong material', 'It was in the wrong city'], correctIndex: 1 },
          ],
        },
      ],
      masteryQuestions: [
        { question: 'What did all people on earth share before Babel?', options: ['The same food', 'The same language', 'The same clothes', 'The same house'], correctIndex: 1, explanation: 'Everyone spoke one common language before this story.' },
        { question: 'Why did the people want to build the tower?', options: ['To reach the heavens and make a name for themselves', 'To hide from a flood', 'To trade with other cities', 'To store grain'], correctIndex: 0, explanation: 'Their goal was pride-driven - reaching the heavens and gaining fame.' },
        { question: 'What was the real problem behind the tower?', options: ['It was too short', 'Pride and trying not to need God', 'The wrong building material', 'It was in the wrong location'], correctIndex: 1, explanation: 'The issue was the prideful motive, not the construction itself.' },
        { question: 'What happened after God confused their language?', options: ['They built a bigger tower', 'They scattered across the earth', 'They stopped talking forever', 'Nothing changed'], correctIndex: 1, explanation: 'Unable to understand each other, the people scattered across the earth.' },
        { question: 'What is the main lesson of the Tower of Babel?', options: ['Pride that pushes God aside leads somewhere different than planned', 'Tall buildings are always wrong', 'Languages never change', 'Cities should never be built'], correctIndex: 0, explanation: 'The story warns about pride and self-sufficiency apart from God.' },
      ],
    },
  ],
}

const abraham: JourneyUnit = {
  key: 'abraham',
  title: 'Abraham',
  kind: 'story',
  emoji: '⭐',
  lessons: [
    {
      key: 'genesis-abraham',
      title: 'Abraham: Called, Promised, Tested',
      reference: 'Genesis 12:1-22:18',
      sections: [
        {
          cards: [
            { emoji: '🎒', text: 'God told a man named Abram to leave his home, his city, and everything familiar, and go to a land God would show him later. Not now - later.', ref: 'Genesis 12:1' },
            { emoji: '🤔', text: 'God didn\'t give Abram a map or an address. Just a promise: "I will bless you and make you a great nation." Abram had to trust without knowing the details.', ref: 'Genesis 12:2-3' },
            { emoji: '🐫', text: "Abram packed up his family and everything he owned and left - at 75 years old - simply because God said so. That kind of trust is what he's remembered for.", ref: 'Genesis 12:4-9' },
          ],
          checkQuestions: [
            { question: 'What did God give Abram to guide his journey?', options: ['A detailed map', 'A promise, without knowing all the details', 'A guide to walk with him', 'Nothing at all'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '⭐', text: 'God changed Abram\'s name to Abraham, meaning "father of many," and promised he\'d have a son with his wife Sarah - even though they were both very old.', ref: 'Genesis 17:5,15-16' },
            { emoji: '😂', text: 'When Sarah overheard this promise, she laughed - she was around 90! It sounded impossible. But nothing is too hard for God to do.', ref: 'Genesis 18:11-14' },
            { emoji: '👶', text: 'A year later, Sarah gave birth to a son named Isaac, whose name means "he laughs" - turning her doubt into joy, exactly as God had promised.', ref: 'Genesis 21:1-7' },
          ],
          checkQuestions: [
            { question: 'Why did Sarah laugh when she heard the promise?', options: ['She was excited', 'It sounded impossible at her age', "She didn't understand the words", 'She was joking around'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '🤝', text: "Abraham's nephew Lot traveled with him. When their herdsmen started arguing over land, Abraham let Lot choose first - even though Abraham could have taken the best for himself.", ref: 'Genesis 13:8-11' },
            { emoji: '🏙️', text: "Lot chose to live near the cities of Sodom and Gomorrah, places full of wickedness. God decided to destroy those cities, but because Abraham asked, God agreed to rescue Lot's family first.", ref: 'Genesis 18:23-33; 19:1-16' },
            { emoji: '🏃', text: "Angels helped Lot's family escape just before the cities were destroyed, warning them not to look back. It's a story about how far God's mercy reaches for the people we care about.", ref: 'Genesis 19:17-29' },
          ],
          checkQuestions: [
            { question: 'What did Abraham do when there was a dispute over land?', options: ['Took the best land for himself', 'Let Lot choose first', 'Kicked Lot out', 'Ignored the problem'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '⛰️', text: 'Years later, God tested Abraham in the hardest way possible: asking him to offer his beloved son Isaac as a sacrifice on a mountain. Abraham obeyed and set out, trusting God completely.', ref: 'Genesis 22:1-3' },
            { emoji: '🐏', text: 'Just as Abraham raised his hand, an angel stopped him. God had provided a ram to sacrifice instead - He never intended for Isaac to actually be harmed. It was a test of trust.', ref: 'Genesis 22:10-13' },
            { emoji: '🙏', text: "Because Abraham trusted God even when it made no sense, God renewed His promise: Abraham's family would become a blessing to every nation on earth.", ref: 'Genesis 22:15-18' },
          ],
          image: '/journey/abraham-isaac-ram-provided.jpg',
          checkQuestions: [
            { question: 'What stopped Abraham at the last moment?', options: ['Isaac ran away', 'An angel stopped him', 'He changed his mind', 'Sarah arrived'], correctIndex: 1 },
          ],
        },
      ],
      masteryQuestions: [
        { question: 'How old was Abram when he left his home?', options: ['25', '50', '75', '100'], correctIndex: 2, explanation: 'Abram was 75 years old when he obeyed and left.' },
        { question: 'What promise did God give Abram?', options: ['To make him a great nation', 'To make him a king right away', 'To give him a house nearby', 'Nothing specific'], correctIndex: 0, explanation: 'God promised to bless Abram and make him a great nation.' },
        { question: "What was Abram's name changed to?", options: ['Isaac', 'Abraham', 'Israel', 'Jacob'], correctIndex: 1, explanation: 'God renamed Abram to Abraham, meaning "father of many."' },
        { question: 'Why did Sarah laugh at the promise?', options: ['She was excited', 'It sounded impossible at her age', "She didn't understand", 'She was joking'], correctIndex: 1, explanation: 'At around 90 years old, having a baby seemed impossible to her.' },
        { question: "What was Isaac's name a reminder of?", options: ["Sarah's laughter turning to joy", 'A hard journey', 'A big mountain', 'A city'], correctIndex: 0, explanation: '"Isaac" means "he laughs," turning her earlier doubt into joy.' },
        { question: 'What did Abraham do about the land dispute with Lot?', options: ['Took the best land for himself', 'Let Lot choose first', 'Kicked Lot out', 'Ignored the problem'], correctIndex: 1, explanation: 'Abraham generously let Lot choose first, even though he could have taken the best.' },
        { question: "Why did God rescue Lot's family before destroying the cities?", options: ['Because Abraham asked', 'By random chance', 'Lot demanded it', "It wasn't on purpose"], correctIndex: 0, explanation: "God agreed to rescue Lot's family specifically because Abraham interceded for them." },
        { question: 'What did God ask Abraham to do on the mountain?', options: ['Build a temple', 'Offer his son Isaac as a sacrifice', 'Move to Egypt', 'Fight a battle'], correctIndex: 1, explanation: 'This was the hardest test God gave Abraham.' },
        { question: 'What did God provide instead of Isaac?', options: ['A ram', 'A dove', 'Gold', 'Nothing'], correctIndex: 0, explanation: "God provided a ram to be sacrificed in Isaac's place." },
        { question: 'What is the main lesson across Abraham\'s story?', options: ['Trusting God even without knowing every detail', 'Never leaving home', 'Maps are unnecessary in life', 'Age prevents new beginnings'], correctIndex: 0, explanation: "Abraham's obedience despite uncertainty, again and again, is the heart of his story." },
      ],
    },
  ],
}

const isaac: JourneyUnit = {
  key: 'isaac',
  title: 'Isaac and Rebekah',
  kind: 'story',
  emoji: '💍',
  lessons: [
    {
      key: 'genesis-isaac',
      title: 'A Wife for Isaac',
      reference: 'Genesis 24:1-67',
      sections: [
        {
          cards: [
            { emoji: '🐪', text: 'Abraham sent his servant on a long journey to find the right wife for Isaac, praying for a clear sign to know who she was when he found her.', ref: 'Genesis 24:1-14' },
            { emoji: '💧', text: "At a well, a kind young woman named Rebekah offered water not just to the servant but to all his camels too - exactly matching the sign he'd prayed for.", ref: 'Genesis 24:15-20' },
            { emoji: '💑', text: 'Rebekah agreed to travel back and marry Isaac, even though it meant leaving her whole family behind. Isaac loved her, and their story shows how God guides even small, everyday choices.', ref: 'Genesis 24:58-67' },
          ],
          checkQuestions: [
            { question: "What did Rebekah do that matched the servant's prayer for a sign?", options: ['She sang a song', 'She gave water to him and his camels', 'She ran away', 'She asked him questions'], correctIndex: 1 },
          ],
        },
      ],
      masteryQuestions: [
        { question: 'Who did Abraham send to find a wife for Isaac?', options: ['Isaac himself', 'His servant', 'Sarah', 'A stranger'], correctIndex: 1, explanation: 'Abraham sent his trusted servant on this journey.' },
        { question: 'Where did the servant meet Rebekah?', options: ['At a well', 'In a marketplace', 'At a wedding', 'In a tent'], correctIndex: 0, explanation: 'Rebekah came to draw water at a well, where the servant waited.' },
        { question: 'What did Rebekah give up to marry Isaac?', options: ['Nothing', 'Her whole family and home', 'Her animals', 'Her name'], correctIndex: 1, explanation: 'She left her entire family behind to travel and marry Isaac.' },
        { question: 'What does this story show about how God guides people?', options: ['Even small, everyday choices can be guided by God', 'God never guides small decisions', 'Only big miracles count as guidance', 'God is uninvolved in daily life'], correctIndex: 0, explanation: 'A simple act of kindness at a well became a clear sign from God.' },
        { question: 'What is the main lesson from this story?', options: ['God can guide even ordinary, everyday moments', 'Marriages never need guidance', 'Wells are always important', 'Servants should never travel alone'], correctIndex: 0, explanation: 'This story highlights how God works through everyday details.' },
      ],
    },
  ],
}

const jacob: JourneyUnit = {
  key: 'jacob',
  title: 'Jacob',
  kind: 'story',
  emoji: '🪜',
  lessons: [
    {
      key: 'genesis-jacob',
      title: 'Jacob: Trickery to Israel',
      reference: 'Genesis 25:19-32:32',
      sections: [
        {
          cards: [
            { emoji: '👬', text: 'Isaac and Rebekah had twin sons, Esau and Jacob. Esau traded away his birthright - his special place as the older son - for a bowl of stew because he was hungry.', ref: 'Genesis 25:29-34' },
            { emoji: '🎭', text: "Later, Jacob and his mother tricked Isaac, who couldn't see well, into giving Jacob the blessing meant for Esau. It wasn't an honest way to get it.", ref: 'Genesis 27:18-29' },
            { emoji: '🏃', text: 'Esau was furious when he found out, and Jacob had to run away from home for years. Trickery got Jacob the blessing, but it cost him his family peace for a long time.', ref: 'Genesis 27:41-45' },
          ],
          checkQuestions: [
            { question: 'What did Esau trade his birthright for?', options: ['Gold', 'A bowl of stew', 'A new tent', 'Nothing, he kept it'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '🌙', text: 'While running from Esau, Jacob stopped for the night, alone and afraid, using a rock as a pillow. That night God gave him an unforgettable dream.', ref: 'Genesis 28:10-11' },
            { emoji: '🪜', text: 'Jacob dreamed of a stairway reaching from earth to heaven, with angels going up and down it, and God standing at the top, speaking directly to him.', ref: 'Genesis 28:12-13' },
            { emoji: '✨', text: 'God repeated to Jacob the same promise He\'d made to Abraham, and added something personal: "I am with you and will watch over you wherever you go."', ref: 'Genesis 28:13-15' },
          ],
          image: '/journey/jacob-ladder-dream.jpg',
          checkQuestions: [
            { question: 'What did Jacob see going up and down the stairway in his dream?', options: ['Birds', 'Angels', 'Clouds', 'Stars'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '🌃', text: 'Years later, on his way home, Jacob spent a night wrestling with a mysterious figure - which turned out to be an encounter with God Himself.', ref: 'Genesis 32:24-25' },
            { emoji: '💪', text: 'Jacob refused to let go, even after being hurt, saying "I will not let you go unless you bless me." His whole life had been about grabbing for blessings - this time, honestly.', ref: 'Genesis 32:26' },
            { emoji: '👑', text: 'God gave Jacob a new name: Israel, meaning "he struggles with God." The nation of Israel is named after this one moment of a man who refused to give up on God.', ref: 'Genesis 32:28' },
          ],
          checkQuestions: [
            { question: 'What did Jacob refuse to do during the struggle?', options: ['Speak', 'Let go without receiving a blessing', 'Run away', 'Sleep'], correctIndex: 1 },
          ],
        },
      ],
      masteryQuestions: [
        { question: 'What did Esau trade his birthright for?', options: ['Gold', 'A bowl of stew', 'A new tent', 'Nothing, he kept it'], correctIndex: 1, explanation: 'Esau gave up his birthright out of hunger for a simple bowl of stew.' },
        { question: "How did Jacob get Isaac's blessing?", options: ['Isaac gave it freely', 'By tricking his father', 'Esau gave it to him', 'He never got it'], correctIndex: 1, explanation: 'Jacob and his mother deceived Isaac to get the blessing meant for Esau.' },
        { question: "What did Jacob's trickery cost him?", options: ['Nothing', "His family's peace for years", 'His health', 'His name'], correctIndex: 1, explanation: 'Jacob had to flee and lost years of peace with his family.' },
        { question: 'What did Jacob see in his dream on the way out of town?', options: ['A stairway to heaven with angels', 'A flood', 'A tower', 'A garden'], correctIndex: 0, explanation: 'He dreamed of a stairway reaching from earth to heaven, with angels on it.' },
        { question: 'What personal promise did God add for Jacob in that dream?', options: ['"I will make you rich"', '"I am with you wherever you go"', '"You will never struggle again"', 'Nothing new'], correctIndex: 1, explanation: 'God personally promised His presence and protection to Jacob.' },
        { question: 'Who did Jacob discover he had been wrestling with, years later?', options: ['A stranger', 'God Himself', 'Esau', 'An animal'], correctIndex: 1, explanation: 'The struggle turned out to be an encounter with God.' },
        { question: 'What new name did God give Jacob?', options: ['Israel', 'Isaac', 'Abram', 'Esau'], correctIndex: 0, explanation: 'God renamed Jacob "Israel" after this encounter.' },
        { question: 'What does this story show about persistence with God?', options: ['Holding on to God, even through struggle, brings blessing', 'Struggling with God always ends badly', "It's better to avoid God entirely", 'Names never change'], correctIndex: 0, explanation: "Jacob's refusal to let go led to a real, honest blessing." },
      ],
    },
  ],
}

const josephPart1: JourneyUnit = {
  key: 'joseph-1',
  title: 'Joseph, Part 1',
  kind: 'story',
  emoji: '👑',
  lessons: [
    {
      key: 'genesis-joseph-1',
      title: 'The Dreamer, Sold and Tested',
      reference: 'Genesis 37:1-39:23',
      sections: [
        {
          cards: [
            { emoji: '🧥', text: 'Jacob had twelve sons, but Joseph was his favorite - so much so that he gave Joseph a special colorful robe. His older brothers noticed, and it made them jealous.', ref: 'Genesis 37:3-4' },
            { emoji: '💤', text: "Joseph had dreams that hinted he'd one day lead his whole family. He told his brothers about them - which, understandably, made them even angrier.", ref: 'Genesis 37:5-9' },
            { emoji: '😡', text: "The jealousy in Joseph's family grew so strong that his own brothers could barely speak to him kindly anymore. A dangerous situation was building.", ref: 'Genesis 37:4,11' },
          ],
          checkQuestions: [
            { question: "Why were Joseph's brothers jealous of him?", options: ['He was the tallest', "He was their father's favorite", 'He was the oldest', 'He had more sheep'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '🕳️', text: "Joseph's brothers got so angry they threw him into a pit and considered killing him. Instead, they decided to sell him as a slave to traders passing by.", ref: 'Genesis 37:23-28' },
            { emoji: '🐫', text: 'Joseph was sold for twenty pieces of silver and carried far away to Egypt - a slave, torn from his family, with no idea what would happen next.', ref: 'Genesis 37:28' },
            { emoji: '💔', text: 'The brothers lied to their father Jacob, telling him Joseph had been killed by a wild animal. Jacob grieved deeply, not knowing the truth.', ref: 'Genesis 37:31-35' },
          ],
          checkQuestions: [
            { question: "What did Joseph's brothers do to him?", options: ['Gave him a promotion', 'Sold him as a slave', 'Sent him on vacation', 'Made him king'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '🏠', text: 'In Egypt, Joseph became a slave in the house of a man named Potiphar. Even in a hard situation, Joseph worked so well that he was put in charge of the whole household.', ref: 'Genesis 39:1-6' },
            { emoji: '🙅', text: "Potiphar's wife tried to get Joseph to do something wrong. Joseph refused, even though it would have been easy to give in. He chose to do right, even unseen.", ref: 'Genesis 39:7-12' },
            { emoji: '⛓️', text: 'She lied about him afterward, and Joseph ended up unfairly thrown in prison - punished for doing the right thing. But even there, God stayed with him.', ref: 'Genesis 39:19-23' },
          ],
          checkQuestions: [
            { question: 'What did Joseph do when he was tempted to do wrong?', options: ['He gave in', 'He refused and chose to do right', 'He ran to tell everyone', 'He ignored the situation completely'], correctIndex: 1 },
          ],
        },
      ],
      masteryQuestions: [
        { question: 'What special gift did Jacob give Joseph?', options: ['A sword', 'A colorful robe', 'A horse', 'Land'], correctIndex: 1, explanation: 'Jacob gave Joseph a special colorful robe as a sign of favor.' },
        { question: "What did Joseph's dreams hint at?", options: ['A famine coming', "He'd one day lead his family", "He'd become a farmer", 'Nothing important'], correctIndex: 1, explanation: "Joseph's dreams suggested he would one day lead his family." },
        { question: "Why were Joseph's brothers jealous of him?", options: ['He was the tallest', "He was their father's favorite", 'He was the oldest', 'He had more sheep'], correctIndex: 1, explanation: "Joseph being their father's clear favorite fueled the jealousy." },
        { question: 'What did the brothers do instead of killing Joseph?', options: ['Sold him as a slave', 'Let him go home', 'Made him a servant at home', 'Nothing'], correctIndex: 0, explanation: 'They sold Joseph as a slave to passing traders.' },
        { question: 'What lie did the brothers tell Jacob?', options: ['Joseph ran away', 'A wild animal killed Joseph', 'Joseph got married', 'Joseph became rich'], correctIndex: 1, explanation: 'They lied that a wild animal had killed Joseph.' },
        { question: 'Where was Joseph taken?', options: ['Egypt', 'Babylon', 'Rome', 'Greece'], correctIndex: 0, explanation: 'Joseph was carried far away to Egypt.' },
        { question: 'What did Joseph do when tempted by Potiphar\'s wife?', options: ['He gave in', 'He refused and chose to do right', 'He told everyone right away', 'He ignored it'], correctIndex: 1, explanation: 'Joseph chose to do right even when it would have been easy to give in.' },
        { question: 'Who stayed with Joseph even in prison?', options: ['No one', 'God', 'Potiphar', 'His brothers'], correctIndex: 1, explanation: 'The Bible says God stayed with Joseph even in that hard place.' },
        { question: 'What does this part of the story show about doing right when it\'s hard?', options: ['It sometimes leads to unfair suffering, but God remains present', 'It always leads to instant reward', 'It never matters what you choose', 'Doing wrong is always safer'], correctIndex: 0, explanation: "Joseph's integrity led to unfair suffering, yet God never left him." },
      ],
    },
  ],
}

const josephPart2: JourneyUnit = {
  key: 'joseph-2',
  title: 'Joseph, Part 2',
  kind: 'story',
  emoji: '👑',
  lessons: [
    {
      key: 'genesis-joseph-2',
      title: "Pharaoh's Dreams and Forgiveness",
      reference: 'Genesis 41:1-45:15',
      sections: [
        {
          cards: [
            { emoji: '👑', text: "Years later, Egypt's Pharaoh had strange dreams no one could explain. Someone remembered that Joseph, still in prison, had a gift for understanding dreams.", ref: 'Genesis 41:1-13' },
            { emoji: '🌾', text: 'Joseph explained that the dreams meant seven years of plenty were coming, followed by seven years of famine - and gave Pharaoh a wise plan to prepare.', ref: 'Genesis 41:25-36' },
            { emoji: '🏛️', text: "Pharaoh was so impressed that he made Joseph second-in-command over all of Egypt - the former slave and prisoner now ran the whole country's food supply.", ref: 'Genesis 41:39-41' },
          ],
          checkQuestions: [
            { question: "What did Joseph's interpretation of the dreams predict?", options: ['A war coming', 'Seven years of plenty, then seven years of famine', 'A flood', 'Nothing important'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '🌾', text: "The famine hit Joseph's home country too. His brothers traveled to Egypt for food, not realizing the powerful official in charge was the brother they'd sold years earlier.", ref: 'Genesis 42:1-8' },
            { emoji: '😭', text: 'Joseph eventually revealed who he was. His brothers were terrified, expecting revenge for what they\'d done. Instead, Joseph wept and embraced them.', ref: 'Genesis 45:1-4' },
            { emoji: '❤️', text: '"Don\'t be afraid," Joseph told them. "God turned what you meant for harm into a way to save many lives." He chose forgiveness over revenge, and it changed everything.', ref: 'Genesis 45:5-8' },
          ],
          checkQuestions: [
            { question: "How did Joseph's brothers expect him to react when they found out who he was?", options: ['With revenge', 'With indifference', 'With laughter', 'They expected nothing'], correctIndex: 0 },
          ],
        },
      ],
      masteryQuestions: [
        { question: 'What problem did Pharaoh have?', options: ['Strange dreams no one could explain', 'A famine already happening', 'A rebellion', 'A missing crown'], correctIndex: 0, explanation: "Pharaoh's dreams troubled him and no one could interpret them." },
        { question: "What did Joseph's interpretation predict?", options: ['A war coming', 'Seven years of plenty, then seven years of famine', 'A flood', 'Nothing important'], correctIndex: 1, explanation: 'Joseph explained the dreams meant seven good years followed by seven hard ones.' },
        { question: 'What position did Pharaoh give Joseph?', options: ['A prisoner again', 'Second-in-command over Egypt', 'A shepherd', 'Nothing, he sent him home'], correctIndex: 1, explanation: 'Pharaoh made Joseph second-in-command over the whole country.' },
        { question: 'Why did Joseph\'s brothers travel to Egypt?', options: ['For food during a famine', 'To trade animals', 'To find Joseph on purpose', 'For a festival'], correctIndex: 0, explanation: 'A famine forced them to travel to Egypt seeking food.' },
        { question: 'How did the brothers expect Joseph to react to them?', options: ['With revenge', 'With indifference', 'With laughter', 'They expected nothing'], correctIndex: 0, explanation: 'They were terrified, expecting Joseph to take revenge.' },
        { question: 'What did Joseph choose instead of revenge?', options: ['Silence', 'Forgiveness', 'Punishment', 'Ignoring them'], correctIndex: 1, explanation: 'Joseph chose to forgive his brothers completely.' },
        { question: 'What did Joseph say God turned their harm into?', options: ['Nothing good', 'A way to save many lives', 'A punishment for them', 'A funny story'], correctIndex: 1, explanation: 'Joseph saw God using their betrayal to save many lives.' },
      ],
    },
  ],
}

const topical: JourneyUnit = {
  key: 'genesis-topics',
  title: 'Big Truths from Genesis',
  kind: 'topical',
  emoji: '💡',
  lessons: [
    {
      key: 'genesis-topic-big-truths',
      title: 'Big Truths from Genesis',
      reference: 'Genesis 1-50 (selected passages)',
      sections: [
        {
          cards: [
            { emoji: '🎨', text: "Everything in creation - every star, every animal, every color - was on purpose. God didn't make the world by accident; He designed it, piece by piece.", ref: 'Genesis 1:1' },
            { emoji: '🪞', text: 'And of everything He made, only people were made "in God\'s image." That means you were made on purpose too, and you matter to God more than you might realize.', ref: 'Genesis 1:27' },
          ],
          checkQuestions: [
            { question: 'Which of these was made "in God\'s image"?', options: ['The sun', 'Animals', 'People', 'The ocean'], correctIndex: 2 },
          ],
        },
        {
          cards: [
            { emoji: '⚖️', text: "Adam and Eve's choice in the garden and Cain's jealousy toward Abel both show the same pattern: sin might feel small at first, but it always leads somewhere real.", ref: 'Genesis 3:6; 4:8' },
            { emoji: '🌱', text: "The good news is that even after both of those failures, God didn't walk away. He kept caring for Adam's family, and kept working His plan forward.", ref: 'Genesis 3:21; 4:15' },
          ],
          checkQuestions: [
            { question: "What pattern do Adam and Eve's choice and Cain's choice both show?", options: ['Sin has no effect', 'Sin always leads somewhere real', 'Only adults sin', 'Sin makes you happy forever'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '🌈', text: 'God promised Noah no flood would ever destroy the whole earth again, and put a rainbow in the sky as a sign. That promise has held for thousands of years.', ref: 'Genesis 9:13' },
            { emoji: '⭐', text: 'God also promised Abraham a family as countless as the stars, even though Abraham was old and it seemed impossible. Both promises came true, exactly as God said.', ref: 'Genesis 15:5-6' },
          ],
          checkQuestions: [
            { question: 'What sign did God give as a reminder of His promise to Noah?', options: ['A star', 'A rainbow', 'A mountain', 'A tree'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '🧭', text: 'Abraham left his home without knowing exactly where he was going, and later was willing to trust God even on the mountain with Isaac. Both times, he obeyed before he understood.', ref: 'Genesis 12:1; 22:2-3' },
            { emoji: '💫', text: "That's what faith really is: trusting God's character even when His plan doesn't fully make sense yet. Abraham is remembered for that kind of trust to this day.", ref: 'Genesis 22:12' },
          ],
          checkQuestions: [
            { question: 'What did Abraham do both times, before he fully understood the plan?', options: ['He refused', 'He obeyed anyway', 'He asked someone else to go instead', 'He waited years to decide'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '🤗', text: "Joseph had every reason to be angry with his brothers - they sold him into slavery. But when he had the power to punish them, he chose to forgive instead.", ref: 'Genesis 45:4-5' },
            { emoji: '🌟', text: "Joseph saw that God had used even his brothers' worst choice for something good. Forgiveness didn't mean pretending it didn't hurt - it meant letting go of revenge.", ref: 'Genesis 50:19-21' },
          ],
          checkQuestions: [
            { question: 'What did Joseph choose to do when he had the power to punish his brothers?', options: ['Punish them severely', 'Forgive them', 'Ignore them forever', 'Send them away'], correctIndex: 1 },
          ],
        },
        {
          cards: [
            { emoji: '🌍', text: 'God told Jacob, running scared from home, "I am with you wherever you go." Not just at home, not just in comfortable places - everywhere.', ref: 'Genesis 28:15' },
            { emoji: '⛓️', text: 'Joseph experienced the same truth in the hardest places: a pit, a prison, a foreign country. The Bible says "the Lord was with Joseph" through every single one of them.', ref: 'Genesis 39:2-3,21' },
          ],
          checkQuestions: [
            { question: 'Where was God with Jacob and Joseph?', options: ['Only in good times', 'Only at home', 'Everywhere, including the hardest places', 'Nowhere in particular'], correctIndex: 2 },
          ],
        },
      ],
      masteryQuestions: [
        { question: "What does being made in God's image tell you?", options: ["You don't matter", 'You were made on purpose and matter to God', 'You are exactly like an animal', 'Nothing special'], correctIndex: 1, explanation: 'It means you were made deliberately and you matter to God.' },
        { question: 'What is the main takeaway from the creation truth?', options: ['You were designed on purpose and matter to God', 'The world made itself', 'Only stars matter to God', 'Nothing in creation has meaning'], correctIndex: 0, explanation: "This truth's whole point is that you matter because you were made on purpose." },
        { question: "What pattern do Adam and Eve's choice and Cain's choice both show?", options: ['Sin has no effect', 'Sin always leads somewhere real', 'Only adults sin', 'Sin makes you happy forever'], correctIndex: 1, explanation: 'Both stories show sin, even small at first, leads to real consequences.' },
        { question: 'Did God walk away after Adam, Eve, and Cain sinned?', options: ['Yes, completely', 'No, He kept caring for them', 'He disappeared forever', 'He punished them and left'], correctIndex: 1, explanation: 'God stayed engaged with them despite their failures.' },
        { question: "Did God's promises to Noah and Abraham come true?", options: ['No', 'Yes, exactly as He said', 'Only partly', "It's unclear"], correctIndex: 1, explanation: 'Both promises were fulfilled exactly as God had said.' },
        { question: "What is faith, based on Abraham's story?", options: ["Trusting God even when it doesn't fully make sense yet", 'Only trusting when you understand everything', 'Doing whatever feels easiest', 'Avoiding hard choices'], correctIndex: 0, explanation: "Faith is trusting God's character even without full understanding." },
        { question: 'What did Joseph choose to do when he had the power to punish his brothers?', options: ['Punish them severely', 'Forgive them', 'Ignore them forever', 'Send them away'], correctIndex: 1, explanation: 'Joseph chose forgiveness over revenge.' },
        { question: "What did Joseph see God had done with his brothers' worst choice?", options: ['Nothing', 'Used it for something good', 'Made it worse', 'Erased it'], correctIndex: 1, explanation: 'Joseph recognized God had used their betrayal for good.' },
        { question: 'Where was God with Jacob and Joseph?', options: ['Only in good times', 'Only at home', 'Everywhere, including the hardest places', 'Nowhere in particular'], correctIndex: 2, explanation: "God's presence reached them in every place, even the hardest ones." },
        { question: 'What does this lesson encourage you to believe about hard places in your own life?', options: ['God can be present there too', 'God avoids hard places', "Only good places have God's presence", "This promise doesn't apply today"], correctIndex: 0, explanation: "This lesson encourages trusting that God's presence reaches every hard place too." },
      ],
    },
  ],
}

export const genesis: JourneyBook = {
  key: 'genesis',
  title: 'Genesis',
  order: 1,
  units: [creation, adamAndEve, cainAndAbel, noah, towerOfBabel, abraham, isaac, jacob, josephPart1, josephPart2, topical],
}
