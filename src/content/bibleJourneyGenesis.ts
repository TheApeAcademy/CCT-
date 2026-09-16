import type { JourneyBook, JourneyUnit } from './bibleJourneyTypes'

// Genesis: the first book of the Bible Journey. More books get added the
// same way, one at a time (Exodus next, then onward) - see BibleJourney.tsx
// for how a book with no units yet shows up as "coming soon" on the map.

const creation: JourneyUnit = {
  key: 'creation',
  title: 'Creation',
  kind: 'story',
  emoji: '🌍',
  lessons: [
    {
      key: 'genesis-creation-1',
      title: 'The Very Beginning',
      reference: 'Genesis 1:1-13',
      cards: [
        { emoji: '🌌', text: 'Before anything else existed, God was already there. The Bible starts with six simple words: "In the beginning God created the heavens and the earth."', ref: 'Genesis 1:1' },
        { emoji: '💡', text: 'The earth was dark and empty, like a room with the lights off. On Day 1, God said "Let there be light" - and light appeared, just like that. No tools, no waiting. Just His word.', ref: 'Genesis 1:2-5' },
        { emoji: '🌊', text: 'On Day 2, God separated the sky from the waters. On Day 3, He gathered the water into oceans and made dry land appear, then filled it with trees, plants, and flowers.', ref: 'Genesis 1:6-13' },
      ],
      midCheck: {
        question: 'How did God make light appear?',
        options: ['He flipped a switch', 'He spoke, and it happened', 'He used fire', 'It was already there'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What existed before God made the heavens and the earth?', options: ['The sun', 'The ocean', 'Just God', 'The stars'], correctIndex: 2 },
        { question: 'On which day did God make dry land and plants?', options: ['Day 1', 'Day 2', 'Day 3', 'Day 7'], correctIndex: 2 },
      ],
    },
    {
      key: 'genesis-creation-2',
      title: 'Living Things',
      reference: 'Genesis 1:14-25',
      cards: [
        { emoji: '☀️', text: 'On Day 4, God hung the sun in the sky to light the day, the moon to light the night, and scattered the stars everywhere. He made them to mark days, seasons, and years.', ref: 'Genesis 1:14-19' },
        { emoji: '🐟', text: 'On Day 5, God filled the oceans with fish of every shape and size, and filled the sky with birds. Whales, tiny fish, eagles, sparrows - all made that day.', ref: 'Genesis 1:20-23' },
        { emoji: '🦁', text: 'On Day 6, God made every land animal: lions, elephants, ants, giraffes. Every single one was His idea first. He looked at all of it and called it good.', ref: 'Genesis 1:24-25' },
      ],
      midCheck: {
        question: 'What did God make on Day 5?',
        options: ['Land animals', 'The sun and moon', 'Fish and birds', 'People'],
        correctIndex: 2,
      },
      endCheckpoint: [
        { question: 'What did God put in the sky on Day 4?', options: ['Birds', 'The sun, moon, and stars', 'Clouds only', 'Nothing yet'], correctIndex: 1 },
        { question: 'What did God call His creation after each day?', options: ['Boring', 'Good', 'Unfinished', 'A mistake'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-creation-3',
      title: 'People and Rest',
      reference: 'Genesis 1:26-2:3',
      cards: [
        { emoji: '🧑‍🤝‍🧑', text: 'On Day 6, God did something different. He made people - not just another animal, but someone made "in His own image," to be like Him in a special way.', ref: 'Genesis 1:26-27' },
        { emoji: '🌳', text: 'God gave Adam and Eve a job: take care of the whole earth, the animals, and each other. He trusted them with something huge, right from the start.', ref: 'Genesis 1:28' },
        { emoji: '🛌', text: 'On Day 7, God rested. Not because He was tired - God never gets tired - but to show that rest matters. He made the whole world in six days and then paused.', ref: 'Genesis 2:1-3' },
      ],
      midCheck: {
        question: 'What makes people different from the animals God made?',
        options: ['People are bigger', 'People are made in God\'s own image', 'People came first', 'People can fly'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What job did God give Adam and Eve?', options: ['Build a tower', 'Take care of the earth', 'Sail the ocean', 'Count the stars'], correctIndex: 1 },
        { question: 'Why did God rest on Day 7?', options: ['He was tired', 'He forgot what to do next', 'To show rest matters', 'He was bored'], correctIndex: 2 },
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
      key: 'genesis-adam-eve-1',
      title: 'The Garden Home',
      reference: 'Genesis 2:8-25',
      image: '/journey/adam-eve-garden-home.jpg',
      cards: [
        { emoji: '🏡', text: 'God planted a beautiful garden called Eden and put Adam right in the middle of it, with every tree and fruit he could want - free to enjoy all of it.', ref: 'Genesis 2:8-9' },
        { emoji: '🚫', text: 'There was one rule: don\'t eat from the tree of the knowledge of good and evil. Just one. Out of an entire garden full of good things, God only said no to that one tree.', ref: 'Genesis 2:16-17' },
        { emoji: '👩', text: 'God saw that Adam needed a companion, so He made Eve. The two of them lived together in the garden, walking and talking with God like friends.', ref: 'Genesis 2:18-25' },
      ],
      midCheck: {
        question: 'How many trees in the garden were off-limits to Adam and Eve?',
        options: ['All of them', 'Ten', 'Just one', 'None'],
        correctIndex: 2,
      },
      endCheckpoint: [
        { question: 'What was the name of the garden God made?', options: ['Canaan', 'Eden', 'Egypt', 'Nazareth'], correctIndex: 1 },
        { question: 'Why did God make Eve?', options: ['Adam asked for a servant', 'Adam needed a companion', 'The animals wanted a friend', 'No reason given'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-adam-eve-2',
      title: 'The First Sin',
      reference: 'Genesis 3:1-24',
      image: '/journey/adam-eve-first-sin.jpg',
      cards: [
        { emoji: '🐍', text: 'A crafty serpent asked Eve, "Did God really say you can\'t eat from any tree?" - twisting the one small rule into something bigger, and planting doubt.', ref: 'Genesis 3:1-5' },
        { emoji: '🍎', text: 'Eve ate the fruit and gave some to Adam, and he ate too. Right away, everything changed - they felt ashamed and hid from God for the first time ever.', ref: 'Genesis 3:6-8' },
        { emoji: '💔', text: 'Their choice had real consequences: they had to leave the garden. But even then, God still cared for them and promised that one day, things would be made right again.', ref: 'Genesis 3:15-24' },
      ],
      midCheck: {
        question: 'What did the serpent do to Eve?',
        options: ['Gave her a gift', 'Twisted God\'s words and planted doubt', 'Told her the truth kindly', 'Ran away'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What happened right after Adam and Eve ate the fruit?', options: ['Nothing changed', 'They felt ashamed and hid', 'They became invisible', 'God ignored them'], correctIndex: 1 },
        { question: 'Even after they sinned, what did God still do?', options: ['Forgot about them', 'Stopped caring completely', 'Still cared and made a promise', 'Left the earth'], correctIndex: 2 },
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
      key: 'genesis-cain-abel-1',
      title: 'Two Brothers, Two Offerings',
      reference: 'Genesis 4:1-16',
      image: '/journey/cain-abel-offerings.jpg',
      cards: [
        { emoji: '👨‍👦', text: 'Adam and Eve\'s sons Cain and Abel each brought an offering to God. Abel brought his best; Cain didn\'t bring his best - and God noticed the difference.', ref: 'Genesis 4:1-5' },
        { emoji: '😠', text: 'Cain got angry that Abel\'s offering pleased God and his didn\'t. God warned Cain to deal with that anger before it controlled him - but Cain didn\'t listen.', ref: 'Genesis 4:6-7' },
        { emoji: '⚰️', text: 'Cain let his anger take over and hurt his brother. It was the first time jealousy led to something that couldn\'t be undone - a hard lesson about where anger can lead.', ref: 'Genesis 4:8-16' },
      ],
      midCheck: {
        question: 'Why did God warn Cain?',
        options: ['Because Cain was hungry', 'Because his anger was about to control him', 'Because Abel was in danger from an animal', 'Because Cain was leaving home'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What made God notice a difference between the two offerings?', options: ['Abel brought his best', 'Cain brought more', 'They looked the same', 'Neither brought anything'], correctIndex: 0 },
        { question: 'What is this story a hard lesson about?', options: ['Farming', 'Where jealousy and anger can lead', 'Cooking food', 'Building houses'], correctIndex: 1 },
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
      key: 'genesis-noah-1',
      title: 'A World Gone Wrong',
      reference: 'Genesis 6:1-8',
      cards: [
        { emoji: '😔', text: 'Many years after Adam and Eve, the world had grown full of people - and full of wrongdoing. God looked at the earth and was deeply grieved by what He saw.', ref: 'Genesis 6:5-6' },
        { emoji: '⭐', text: 'But one man stood out: Noah. The Bible says Noah "found favor in the eyes of the Lord" - he tried to live rightly even when almost no one around him did.', ref: 'Genesis 6:8-9' },
        { emoji: '🗣️', text: 'God told Noah His plan: a flood would come to wash the earth clean, but Noah and his family would be kept safe. Noah just had to trust and obey.', ref: 'Genesis 6:13-18' },
      ],
      midCheck: {
        question: 'What made Noah stand out from everyone else?',
        options: ['He was the tallest', 'He found favor with God by living rightly', 'He was the richest', 'He was the oldest'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'How did God feel about the wrongdoing filling the earth?', options: ['He didn\'t notice', 'Deeply grieved', 'Excited', 'Curious'], correctIndex: 1 },
        { question: 'What did God promise to do for Noah\'s family?', options: ['Nothing', 'Keep them safe', 'Send them away first', 'Make them rich'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-noah-2',
      title: 'Building the Ark',
      reference: 'Genesis 6:14-22',
      image: '/journey/noah-building-ark.jpg',
      cards: [
        { emoji: '🔨', text: 'God gave Noah exact instructions for a massive boat called an ark, built from cypress wood, coated in tar, with rooms inside for his family and every kind of animal.', ref: 'Genesis 6:14-16' },
        { emoji: '🐘', text: 'Noah was told to bring two of every kind of animal on board - male and female - so life could continue after the flood. That\'s a lot of animals to gather.', ref: 'Genesis 6:19-20' },
        { emoji: '⏳', text: 'It likely took Noah decades to build the ark, with no rain in sight and neighbors probably laughing at him the whole time. Noah kept building anyway, exactly as God said.', ref: 'Genesis 6:22' },
      ],
      midCheck: {
        question: 'How many of each kind of animal did Noah bring on the ark?',
        options: ['One', 'Two', 'Ten', 'A hundred'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What was the ark made of?', options: ['Stone', 'Cypress wood', 'Metal', 'Ice'], correctIndex: 1 },
        { question: 'Did Noah follow God\'s instructions exactly?', options: ['No, he changed the plan', 'Yes, exactly as God said', 'He gave up halfway', 'He asked someone else to do it'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-noah-3',
      title: 'The Flood Comes',
      reference: 'Genesis 7:1-24',
      cards: [
        { emoji: '🌧️', text: 'Once the animals and Noah\'s family were safely inside, God shut the door Himself. Rain fell for 40 days and 40 nights, and water covered the whole earth.', ref: 'Genesis 7:11-12' },
        { emoji: '🌊', text: 'The water rose so high it covered even the tallest mountains. Everyone and everything outside the ark was gone - but Noah\'s family and the animals stayed safe inside.', ref: 'Genesis 7:17-23' },
        { emoji: '🕊️', text: 'The ark floated for months. Noah eventually sent out a dove to check for dry land, and when it came back with an olive leaf, he knew the water was going down.', ref: 'Genesis 8:6-12' },
      ],
      midCheck: {
        question: 'How long did the rain fall?',
        options: ['One day', '7 days', '40 days and 40 nights', 'A whole year'],
        correctIndex: 2,
      },
      endCheckpoint: [
        { question: 'Who shut the door of the ark?', options: ['Noah', 'God Himself', 'One of the animals', 'Nobody, it locked on its own'], correctIndex: 1 },
        { question: 'What did the dove bring back to show land was near?', options: ['A fish', 'A rock', 'An olive leaf', 'Nothing'], correctIndex: 2 },
      ],
    },
    {
      key: 'genesis-noah-4',
      title: 'The Rainbow Promise',
      reference: 'Genesis 9:8-17',
      image: '/journey/noah-dove-olive-branch.jpg',
      cards: [
        { emoji: '🐾', text: 'When the water finally dried up, Noah, his family, and every animal walked out onto dry land again. The first thing Noah did was build an altar and thank God.', ref: 'Genesis 8:15-20' },
        { emoji: '🌈', text: 'God made a promise - a covenant - that He would never flood the whole earth again. As a sign of that promise, He set a rainbow in the sky.', ref: 'Genesis 9:11-13' },
        { emoji: '🤝', text: 'That rainbow wasn\'t just pretty - it was God\'s reminder to every generation after Noah, including us, that He keeps His promises no matter how much time passes.', ref: 'Genesis 9:16-17' },
      ],
      midCheck: {
        question: 'What sign did God put in the sky as a promise?',
        options: ['A star', 'A rainbow', 'A cloud shaped like a boat', 'Lightning'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What did Noah do first after leaving the ark?', options: ['Went fishing', 'Built an altar and thanked God', 'Went to sleep', 'Built a new house'], correctIndex: 1 },
        { question: 'What did God promise never to do again?', options: ['Flood the whole earth', 'Send rain at all', 'Make more animals', 'Talk to people'], correctIndex: 0 },
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
      key: 'genesis-babel-1',
      title: 'One Language, One Tower',
      reference: 'Genesis 11:1-9',
      image: '/journey/tower-of-babel.jpg',
      cards: [
        { emoji: '🗣️', text: 'After the flood, everyone on earth spoke the same language. A group of people decided to build a massive tower "to reach the heavens" and make a name for themselves.', ref: 'Genesis 11:1-4' },
        { emoji: '🏙️', text: 'The problem wasn\'t the building itself - it was the reason behind it: pride, and trying to prove they didn\'t need God at all.', ref: 'Genesis 11:4' },
        { emoji: '🌍', text: 'God confused their language so they could no longer understand each other, and they scattered across the earth. That\'s part of how so many different languages began.', ref: 'Genesis 11:7-9' },
      ],
      midCheck: {
        question: 'What was the real problem with the tower?',
        options: ['It was too short', 'Pride, and trying to not need God', 'It was made of the wrong material', 'It was in the wrong city'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What did all people on earth share before Babel?', options: ['The same food', 'The same language', 'The same clothes', 'The same house'], correctIndex: 1 },
        { question: 'What happened after God confused their language?', options: ['They built a bigger tower', 'They scattered across the earth', 'They stopped talking forever', 'Nothing changed'], correctIndex: 1 },
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
      key: 'genesis-abraham-1',
      title: 'God Calls Abram',
      reference: 'Genesis 12:1-9',
      cards: [
        { emoji: '🎒', text: 'God told a man named Abram to leave his home, his city, and everything familiar, and go to a land God would show him later. Not now - later.', ref: 'Genesis 12:1' },
        { emoji: '🤔', text: 'God didn\'t give Abram a map or an address. Just a promise: "I will bless you and make you a great nation." Abram had to trust without knowing the details.', ref: 'Genesis 12:2-3' },
        { emoji: '🐫', text: 'Abram packed up his family and everything he owned and left - at 75 years old - simply because God said so. That kind of trust is what he\'s remembered for.', ref: 'Genesis 12:4-9' },
      ],
      midCheck: {
        question: 'What did God give Abram to guide his journey?',
        options: ['A detailed map', 'A promise, without knowing all the details', 'A guide to walk with him', 'Nothing at all'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'How old was Abram when he left his home?', options: ['25', '50', '75', '100'], correctIndex: 2 },
        { question: 'What did God promise to do for Abram?', options: ['Make him a great nation', 'Make him a king right away', 'Give him a new house nearby', 'Nothing specific'], correctIndex: 0 },
      ],
    },
    {
      key: 'genesis-abraham-2',
      title: 'The Promise of a Son',
      reference: 'Genesis 17:1-19',
      cards: [
        { emoji: '⭐', text: 'God changed Abram\'s name to Abraham, meaning "father of many," and promised he\'d have a son with his wife Sarah - even though they were both very old.', ref: 'Genesis 17:5,15-16' },
        { emoji: '😂', text: 'When Sarah overheard this promise, she laughed - she was around 90! It sounded impossible. But nothing is too hard for God to do.', ref: 'Genesis 18:11-14' },
        { emoji: '👶', text: 'A year later, Sarah gave birth to a son named Isaac, whose name means "he laughs" - turning her doubt into joy, exactly as God had promised.', ref: 'Genesis 21:1-7' },
      ],
      midCheck: {
        question: 'Why did Sarah laugh when she heard the promise?',
        options: ['She was excited', 'It sounded impossible at her age', 'She didn\'t understand the words', 'She was joking around'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What does the name "Abraham" mean?', options: ['Strong warrior', 'Father of many', 'Wise teacher', 'Traveler'], correctIndex: 1 },
        { question: 'What was Isaac\'s name a reminder of?', options: ['Sarah\'s laughter turning to joy', 'A hard journey', 'A big mountain', 'A city'], correctIndex: 0 },
      ],
    },
    {
      key: 'genesis-abraham-3',
      title: 'Abraham and Lot',
      reference: 'Genesis 13:1-12; 19:1-29',
      cards: [
        { emoji: '🤝', text: 'Abraham\'s nephew Lot traveled with him. When their herdsmen started arguing over land, Abraham let Lot choose first - even though Abraham could have taken the best for himself.', ref: 'Genesis 13:8-11' },
        { emoji: '🏙️', text: 'Lot chose to live near the cities of Sodom and Gomorrah, places full of wickedness. God decided to destroy those cities, but because Abraham asked, God agreed to rescue Lot\'s family first.', ref: 'Genesis 18:23-33; 19:1-16' },
        { emoji: '🏃', text: 'Angels helped Lot\'s family escape just before the cities were destroyed, warning them not to look back. It\'s a story about how far God\'s mercy reaches for the people we care about.', ref: 'Genesis 19:17-29' },
      ],
      midCheck: {
        question: 'What did Abraham do when there was a dispute over land?',
        options: ['Took the best land for himself', 'Let Lot choose first', 'Kicked Lot out', 'Ignored the problem'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'Why did God rescue Lot\'s family before destroying the cities?', options: ['Because Abraham asked', 'By random chance', 'Lot demanded it', 'It wasn\'t on purpose'], correctIndex: 0 },
        { question: 'What were Lot\'s family told not to do while escaping?', options: ['Run too fast', 'Bring anything with them', 'Look back', 'Speak to anyone'], correctIndex: 2 },
      ],
    },
    {
      key: 'genesis-abraham-4',
      title: 'The Test on the Mountain',
      reference: 'Genesis 22:1-18',
      image: '/journey/abraham-isaac-ram-provided.jpg',
      cards: [
        { emoji: '⛰️', text: 'Years later, God tested Abraham in the hardest way possible: asking him to offer his beloved son Isaac as a sacrifice on a mountain. Abraham obeyed and set out, trusting God completely.', ref: 'Genesis 22:1-3' },
        { emoji: '🐏', text: 'Just as Abraham raised his hand, an angel stopped him. God had provided a ram to sacrifice instead - He never intended for Isaac to actually be harmed. It was a test of trust.', ref: 'Genesis 22:10-13' },
        { emoji: '🙏', text: 'Because Abraham trusted God even when it made no sense, God renewed His promise: Abraham\'s family would become a blessing to every nation on earth.', ref: 'Genesis 22:15-18' },
      ],
      midCheck: {
        question: 'What stopped Abraham at the last moment?',
        options: ['Isaac ran away', 'An angel stopped him', 'He changed his mind', 'Sarah arrived'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What did God provide instead of Isaac?', options: ['A ram', 'A dove', 'Gold', 'Nothing'], correctIndex: 0 },
        { question: 'What was this whole story really testing?', options: ['Abraham\'s strength', 'Abraham\'s trust in God', 'Isaac\'s obedience', 'How fast Abraham could climb'], correctIndex: 1 },
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
      key: 'genesis-isaac-1',
      title: 'A Wife for Isaac',
      reference: 'Genesis 24:1-67',
      cards: [
        { emoji: '🐪', text: 'Abraham sent his servant on a long journey to find the right wife for Isaac, praying for a clear sign to know who she was when he found her.', ref: 'Genesis 24:1-14' },
        { emoji: '💧', text: 'At a well, a kind young woman named Rebekah offered water not just to the servant but to all his camels too - exactly matching the sign he\'d prayed for.', ref: 'Genesis 24:15-20' },
        { emoji: '💑', text: 'Rebekah agreed to travel back and marry Isaac, even though it meant leaving her whole family behind. Isaac loved her, and their story shows how God guides even small, everyday choices.', ref: 'Genesis 24:58-67' },
      ],
      midCheck: {
        question: 'What did Rebekah do that matched the servant\'s prayer for a sign?',
        options: ['She sang a song', 'She gave water to him and his camels', 'She ran away', 'She asked him questions'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'Who did Abraham send to find a wife for Isaac?', options: ['Isaac himself', 'His servant', 'Sarah', 'A stranger'], correctIndex: 1 },
        { question: 'What did Rebekah give up to marry Isaac?', options: ['Nothing', 'Her whole family and home', 'Her animals', 'Her name'], correctIndex: 1 },
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
      key: 'genesis-jacob-1',
      title: 'The Birthright and the Blessing',
      reference: 'Genesis 25:19-34; 27:1-40',
      cards: [
        { emoji: '👬', text: 'Isaac and Rebekah had twin sons, Esau and Jacob. Esau traded away his birthright - his special place as the older son - for a bowl of stew because he was hungry.', ref: 'Genesis 25:29-34' },
        { emoji: '🎭', text: 'Later, Jacob and his mother tricked Isaac, who couldn\'t see well, into giving Jacob the blessing meant for Esau. It wasn\'t an honest way to get it.', ref: 'Genesis 27:18-29' },
        { emoji: '🏃', text: 'Esau was furious when he found out, and Jacob had to run away from home for years. Trickery got Jacob the blessing, but it cost him his family peace for a long time.', ref: 'Genesis 27:41-45' },
      ],
      midCheck: {
        question: 'What did Esau trade his birthright for?',
        options: ['Gold', 'A bowl of stew', 'A new tent', 'Nothing, he kept it'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'How did Jacob get Isaac\'s blessing?', options: ['Isaac gave it freely', 'By tricking his father', 'Esau gave it to him', 'He never got it'], correctIndex: 1 },
        { question: 'What did Jacob\'s trickery cost him?', options: ['Nothing', 'His family\'s peace for years', 'His health', 'His name'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-jacob-2',
      title: "Jacob's Ladder",
      reference: 'Genesis 28:10-22',
      image: '/journey/jacob-ladder-dream.jpg',
      cards: [
        { emoji: '🌙', text: 'While running from Esau, Jacob stopped for the night, alone and afraid, using a rock as a pillow. That night God gave him an unforgettable dream.', ref: 'Genesis 28:10-11' },
        { emoji: '🪜', text: 'Jacob dreamed of a stairway reaching from earth to heaven, with angels going up and down it, and God standing at the top, speaking directly to him.', ref: 'Genesis 28:12-13' },
        { emoji: '✨', text: 'God repeated to Jacob the same promise He\'d made to Abraham, and added something personal: "I am with you and will watch over you wherever you go."', ref: 'Genesis 28:13-15' },
      ],
      midCheck: {
        question: 'What did Jacob see going up and down the stairway in his dream?',
        options: ['Birds', 'Angels', 'Clouds', 'Stars'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What was Jacob\'s situation when he had this dream?', options: ['Celebrating at a feast', 'Alone and running from Esau', 'At home with his family', 'On a boat'], correctIndex: 1 },
        { question: 'What personal promise did God add for Jacob?', options: ['"I will make you rich"', '"I am with you wherever you go"', '"You will never struggle again"', 'Nothing new'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-jacob-3',
      title: 'Jacob Becomes Israel',
      reference: 'Genesis 32:22-32',
      cards: [
        { emoji: '🌃', text: 'Years later, on his way home, Jacob spent a night wrestling with a mysterious figure - which turned out to be an encounter with God Himself.', ref: 'Genesis 32:24-25' },
        { emoji: '💪', text: 'Jacob refused to let go, even after being hurt, saying "I will not let you go unless you bless me." His whole life had been about grabbing for blessings - this time, honestly.', ref: 'Genesis 32:26' },
        { emoji: '👑', text: 'God gave Jacob a new name: Israel, meaning "he struggles with God." The nation of Israel is named after this one moment of a man who refused to give up on God.', ref: 'Genesis 32:28' },
      ],
      midCheck: {
        question: 'What did Jacob refuse to do during the struggle?',
        options: ['Speak', 'Let go without receiving a blessing', 'Run away', 'Sleep'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What new name did God give Jacob?', options: ['Israel', 'Isaac', 'Abram', 'Esau'], correctIndex: 0 },
        { question: 'What does the name "Israel" mean?', options: ['He struggles with God', 'Father of many', 'He laughs', 'Chosen one'], correctIndex: 0 },
      ],
    },
  ],
}

const joseph: JourneyUnit = {
  key: 'joseph',
  title: 'Joseph',
  kind: 'story',
  emoji: '👑',
  lessons: [
    {
      key: 'genesis-joseph-1',
      title: 'The Dreamer',
      reference: 'Genesis 37:1-11',
      cards: [
        { emoji: '🧥', text: 'Jacob had twelve sons, but Joseph was his favorite - so much so that he gave Joseph a special colorful robe. His older brothers noticed, and it made them jealous.', ref: 'Genesis 37:3-4' },
        { emoji: '💤', text: 'Joseph had dreams that hinted he\'d one day lead his whole family. He told his brothers about them - which, understandably, made them even angrier.', ref: 'Genesis 37:5-9' },
        { emoji: '😡', text: 'The jealousy in Joseph\'s family grew so strong that his own brothers could barely speak to him kindly anymore. A dangerous situation was building.', ref: 'Genesis 37:4,11' },
      ],
      midCheck: {
        question: 'Why were Joseph\'s brothers jealous of him?',
        options: ['He was the tallest', 'He was their father\'s favorite', 'He was the oldest', 'He had more sheep'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What special gift did Jacob give Joseph?', options: ['A sword', 'A colorful robe', 'A horse', 'Land'], correctIndex: 1 },
        { question: 'What did Joseph\'s dreams hint at?', options: ['A famine coming', 'He\'d one day lead his family', 'He\'d become a farmer', 'Nothing important'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-joseph-2',
      title: 'Sold into Egypt',
      reference: 'Genesis 37:12-36',
      cards: [
        { emoji: '🕳️', text: 'Joseph\'s brothers got so angry they threw him into a pit and considered killing him. Instead, they decided to sell him as a slave to traders passing by.', ref: 'Genesis 37:23-28' },
        { emoji: '🐫', text: 'Joseph was sold for twenty pieces of silver and carried far away to Egypt - a slave, torn from his family, with no idea what would happen next.', ref: 'Genesis 37:28' },
        { emoji: '💔', text: 'The brothers lied to their father Jacob, telling him Joseph had been killed by a wild animal. Jacob grieved deeply, not knowing the truth.', ref: 'Genesis 37:31-35' },
      ],
      midCheck: {
        question: 'What did Joseph\'s brothers do to him?',
        options: ['Gave him a promotion', 'Sold him as a slave', 'Sent him on vacation', 'Made him king'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'Where was Joseph taken?', options: ['Egypt', 'Babylon', 'Rome', 'Greece'], correctIndex: 0 },
        { question: 'What lie did the brothers tell Jacob?', options: ['Joseph ran away', 'A wild animal killed Joseph', 'Joseph got married', 'Joseph became rich'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-joseph-3',
      title: "Joseph's Character Tested",
      reference: 'Genesis 39:1-23',
      cards: [
        { emoji: '🏠', text: 'In Egypt, Joseph became a slave in the house of a man named Potiphar. Even in a hard situation, Joseph worked so well that he was put in charge of the whole household.', ref: 'Genesis 39:1-6' },
        { emoji: '🙅', text: 'Potiphar\'s wife tried to get Joseph to do something wrong. Joseph refused, even though it would have been easy to give in. He chose to do right, even unseen.', ref: 'Genesis 39:7-12' },
        { emoji: '⛓️', text: 'She lied about him afterward, and Joseph ended up unfairly thrown in prison - punished for doing the right thing. But even there, God stayed with him.', ref: 'Genesis 39:19-23' },
      ],
      midCheck: {
        question: 'What did Joseph do when he was tempted to do wrong?',
        options: ['He gave in', 'He refused and chose to do right', 'He ran to tell everyone', 'He ignored the situation completely'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What happened to Joseph even though he did the right thing?', options: ['He got a reward', 'He was unfairly thrown in prison', 'Nothing happened', 'He was set free immediately'], correctIndex: 1 },
        { question: 'Who stayed with Joseph even in prison?', options: ['No one', 'God', 'Potiphar', 'His brothers'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-joseph-4',
      title: "Pharaoh's Dreams",
      reference: 'Genesis 41:1-57',
      cards: [
        { emoji: '👑', text: 'Years later, Egypt\'s Pharaoh had strange dreams no one could explain. Someone remembered that Joseph, still in prison, had a gift for understanding dreams.', ref: 'Genesis 41:1-13' },
        { emoji: '🌾', text: 'Joseph explained that the dreams meant seven years of plenty were coming, followed by seven years of famine - and gave Pharaoh a wise plan to prepare.', ref: 'Genesis 41:25-36' },
        { emoji: '🏛️', text: 'Pharaoh was so impressed that he made Joseph second-in-command over all of Egypt - the former slave and prisoner now ran the whole country\'s food supply.', ref: 'Genesis 41:39-41' },
      ],
      midCheck: {
        question: "What did Joseph's interpretation of the dreams predict?",
        options: ['A war coming', 'Seven years of plenty, then seven years of famine', 'A flood', 'Nothing important'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What position did Pharaoh give Joseph?', options: ['A prisoner again', 'Second-in-command over Egypt', 'A shepherd', 'Nothing, he sent him home'], correctIndex: 1 },
        { question: 'How did Joseph go from prisoner to leader?', options: ['He bribed someone', 'God gave him wisdom to understand the dreams', 'He fought for the position', 'Pure luck'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-joseph-5',
      title: 'Forgiving His Brothers',
      reference: 'Genesis 45:1-15',
      cards: [
        { emoji: '🌾', text: 'The famine hit Joseph\'s home country too. His brothers traveled to Egypt for food, not realizing the powerful official in charge was the brother they\'d sold years earlier.', ref: 'Genesis 42:1-8' },
        { emoji: '😭', text: 'Joseph eventually revealed who he was. His brothers were terrified, expecting revenge for what they\'d done. Instead, Joseph wept and embraced them.', ref: 'Genesis 45:1-4' },
        { emoji: '❤️', text: '"Don\'t be afraid," Joseph told them. "God turned what you meant for harm into a way to save many lives." He chose forgiveness over revenge, and it changed everything.', ref: 'Genesis 45:5-8' },
      ],
      midCheck: {
        question: 'How did Joseph\'s brothers expect him to react when they found out who he was?',
        options: ['With revenge', 'With indifference', 'With laughter', 'They expected nothing'],
        correctIndex: 0,
      },
      endCheckpoint: [
        { question: 'What did Joseph choose instead of revenge?', options: ['Silence', 'Forgiveness', 'Punishment', 'Ignoring them'], correctIndex: 1 },
        { question: 'What did Joseph say God turned their harm into?', options: ['Nothing good', 'A way to save many lives', 'A punishment for them', 'A funny story'], correctIndex: 1 },
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
      key: 'genesis-topic-design',
      title: "God's Amazing Design",
      reference: 'Genesis 1:1-31',
      cards: [
        { emoji: '🎨', text: 'Everything in creation - every star, every animal, every color - was on purpose. God didn\'t make the world by accident; He designed it, piece by piece.', ref: 'Genesis 1:1' },
        { emoji: '🪞', text: 'And of everything He made, only people were made "in God\'s image." That means you were made on purpose too, and you matter to God more than you might realize.', ref: 'Genesis 1:27' },
      ],
      midCheck: {
        question: 'Which of these was made "in God\'s image"?',
        options: ['The sun', 'Animals', 'People', 'The ocean'],
        correctIndex: 2,
      },
      endCheckpoint: [
        { question: 'Was creation an accident or on purpose?', options: ['An accident', 'On purpose', 'Nobody knows', 'It just appeared'], correctIndex: 1 },
        { question: 'What does being made in God\'s image tell you?', options: ['You don\'t matter', 'You were made on purpose and matter to God', 'You are exactly like an animal', 'Nothing special'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-topic-sin',
      title: 'Sin Has Consequences',
      reference: 'Genesis 3:1-24; 4:1-16',
      cards: [
        { emoji: '⚖️', text: 'Adam and Eve\'s choice in the garden and Cain\'s jealousy toward Abel both show the same pattern: sin might feel small at first, but it always leads somewhere real.', ref: 'Genesis 3:6; 4:8' },
        { emoji: '🌱', text: 'The good news is that even after both of those failures, God didn\'t walk away. He kept caring for Adam\'s family, and kept working His plan forward.', ref: 'Genesis 3:21; 4:15' },
      ],
      midCheck: {
        question: 'What pattern do Adam and Eve\'s choice and Cain\'s choice both show?',
        options: ['Sin has no effect', 'Sin always leads somewhere real', 'Only adults sin', 'Sin makes you happy forever'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'Did God walk away after Adam, Eve, and Cain sinned?', options: ['Yes, completely', 'No, He kept caring for them', 'He disappeared forever', 'He punished them and left'], correctIndex: 1 },
        { question: 'What is this topic really about?', options: ['Farming', 'Sin having real consequences', 'Building boats', 'Counting animals'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-topic-promise',
      title: "God Always Keeps His Promises",
      reference: 'Genesis 9:8-17; 15:1-6',
      cards: [
        { emoji: '🌈', text: 'God promised Noah no flood would ever destroy the whole earth again, and put a rainbow in the sky as a sign. That promise has held for thousands of years.', ref: 'Genesis 9:13' },
        { emoji: '⭐', text: 'God also promised Abraham a family as countless as the stars, even though Abraham was old and it seemed impossible. Both promises came true, exactly as God said.', ref: 'Genesis 15:5-6' },
      ],
      midCheck: {
        question: 'What sign did God give as a reminder of His promise to Noah?',
        options: ['A star', 'A rainbow', 'A mountain', 'A tree'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What did God promise Abraham?', options: ['Riches only', 'A family as countless as the stars', 'A new house', 'Nothing specific'], correctIndex: 1 },
        { question: 'Did God\'s promises to Noah and Abraham come true?', options: ['No', 'Yes, exactly as He said', 'Only partly', 'It\'s unclear'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-topic-faith',
      title: 'Faith Means Trusting God',
      reference: 'Genesis 12:1-4; 22:1-14',
      cards: [
        { emoji: '🧭', text: 'Abraham left his home without knowing exactly where he was going, and later was willing to trust God even on the mountain with Isaac. Both times, he obeyed before he understood.', ref: 'Genesis 12:1; 22:2-3' },
        { emoji: '💫', text: 'That\'s what faith really is: trusting God\'s character even when His plan doesn\'t fully make sense yet. Abraham is remembered for that kind of trust to this day.', ref: 'Genesis 22:12' },
      ],
      midCheck: {
        question: 'What did Abraham do both times, before he fully understood the plan?',
        options: ['He refused', 'He obeyed anyway', 'He asked someone else to go instead', 'He waited years to decide'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'What is faith, based on Abraham\'s story?', options: ['Trusting God even when it doesn\'t fully make sense yet', 'Only trusting when you understand everything', 'Doing whatever feels easiest', 'Avoiding hard choices'], correctIndex: 0 },
        { question: 'What is Abraham remembered for?', options: ['His farming', 'His trust in God', 'His wealth', 'His singing'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-topic-forgiveness',
      title: 'Choosing Forgiveness',
      reference: 'Genesis 45:1-15; 50:15-21',
      cards: [
        { emoji: '🤗', text: 'Joseph had every reason to be angry with his brothers - they sold him into slavery. But when he had the power to punish them, he chose to forgive instead.', ref: 'Genesis 45:4-5' },
        { emoji: '🌟', text: 'Joseph saw that God had used even his brothers\' worst choice for something good. Forgiveness didn\'t mean pretending it didn\'t hurt - it meant letting go of revenge.', ref: 'Genesis 50:19-21' },
      ],
      midCheck: {
        question: 'What did Joseph choose to do when he had the power to punish his brothers?',
        options: ['Punish them severely', 'Forgive them', 'Ignore them forever', 'Send them away'],
        correctIndex: 1,
      },
      endCheckpoint: [
        { question: 'Did forgiving mean Joseph pretended it never hurt?', options: ['Yes', 'No, it meant letting go of revenge', 'He forgot everything happened', 'He never thought about it again'], correctIndex: 1 },
        { question: 'What did Joseph see God had done with his brothers\' worst choice?', options: ['Nothing', 'Used it for something good', 'Made it worse', 'Erased it'], correctIndex: 1 },
      ],
    },
    {
      key: 'genesis-topic-presence',
      title: 'God Is With Us Everywhere',
      reference: 'Genesis 28:15; 39:2-3',
      cards: [
        { emoji: '🌍', text: 'God told Jacob, running scared from home, "I am with you wherever you go." Not just at home, not just in comfortable places - everywhere.', ref: 'Genesis 28:15' },
        { emoji: '⛓️', text: 'Joseph experienced the same truth in the hardest places: a pit, a prison, a foreign country. The Bible says "the Lord was with Joseph" through every single one of them.', ref: 'Genesis 39:2-3,21' },
      ],
      midCheck: {
        question: 'Where was God with Jacob and Joseph?',
        options: ['Only in good times', 'Only at home', 'Everywhere, including the hardest places', 'Nowhere in particular'],
        correctIndex: 2,
      },
      endCheckpoint: [
        { question: 'What did God tell Jacob while he was running scared?', options: ['"You are on your own"', '"I am with you wherever you go"', '"Go back home now"', 'Nothing'], correctIndex: 1 },
        { question: 'Where did Joseph experience God\'s presence?', options: ['Only when he was Pharaoh\'s second-in-command', 'Even in a pit and in prison', 'Never', 'Only in dreams'], correctIndex: 1 },
      ],
    },
  ],
}

export const genesis: JourneyBook = {
  key: 'genesis',
  title: 'Genesis',
  order: 1,
  units: [creation, adamAndEve, cainAndAbel, noah, towerOfBabel, abraham, isaac, jacob, joseph, topical],
}
