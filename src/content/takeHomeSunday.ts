// Take-Home Sunday - what a family does at home with each of the Sunday
// School lesson themes in sundaySchoolCalendar.ts, in the same order, so the
// parent's sheet for a Sunday matches the theme the child's Sunday room shows
// for it. Verses are King James, as the ministry quotes them.

export type HomeTaskKind = 'talk' | 'do' | 'read' | 'verse'

export interface TakeHomeSheet {
  ref: string
  summary: string
  verse: string
  verseRef: string
  prayer: string
  tasks: [HomeTaskKind, string][]
}

export const TAKE_HOME_SHEETS: TakeHomeSheet[] = [
  {
    ref: 'Genesis 1-2',
    summary: 'Seven days, one Creator. This lesson walks through each day of creation and shows that God made everything good, and made us because He loves us.',
    verse: 'In the beginning God created the heaven and the earth.',
    verseRef: 'Genesis 1:1',
    prayer: 'Thank You, God, for making the sun, the stars, the animals and us. Help us take care of everything You made. Amen.',
    tasks: [
      ['talk', 'What is your favourite thing God made? Why?'],
      ['do', 'Go on a walk and find something from each day of creation.'],
      ['read', 'Read Genesis 1 together.'],
      ['verse', 'Say Genesis 1:1 together three times this week.'],
    ],
  },
  {
    ref: 'Genesis 3',
    summary: 'Adam and Eve listened to the serpent instead of God. This lesson shows that sin hurts our friendship with God, and that God still cared for them and made a way back.',
    verse: 'If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.',
    verseRef: '1 John 1:9',
    prayer: 'Dear God, thank You that You forgive us when we say sorry. Help us listen to You and choose what is right. Amen.',
    tasks: [
      ['talk', 'Why do you think Adam and Eve hid from God?'],
      ['talk', 'How does it feel when someone forgives you?'],
      ['read', 'Read Genesis 3:1-13 together.'],
      ['verse', 'Practise 1 John 1:9.'],
    ],
  },
  {
    ref: 'Genesis 4',
    summary: 'Cain and Abel both brought offerings to God, but Cain let anger grow in his heart. This lesson is about giving God our best and dealing with anger before it hurts others.',
    verse: 'For this is the message that ye heard from the beginning, that we should love one another.',
    verseRef: '1 John 3:11',
    prayer: 'Lord, help us give You our best. When we feel angry, help us stop, pray and be kind instead. Amen.',
    tasks: [
      ['talk', 'What can we do when we start to feel angry or jealous?'],
      ['do', 'Do one kind thing for a brother, sister or friend this week.'],
      ['read', 'Read Genesis 4:1-10 together.'],
      ['verse', 'Practise 1 John 3:11.'],
    ],
  },
  {
    ref: 'Genesis 6-7',
    summary: 'God asked Noah to build an ark, and Noah obeyed even when people laughed. This lesson is about trusting and obeying God when it is hard.',
    verse: 'Thus did Noah; according to all that God commanded him, so did he.',
    verseRef: 'Genesis 6:22',
    prayer: 'Dear God, help our family obey You, even when others do not understand. Thank You for keeping Noah and his family safe. Amen.',
    tasks: [
      ['talk', 'Why do you think Noah kept building even when people laughed?'],
      ['do', 'Build a little ark from a box or blocks and fill it with toy animals, two by two.'],
      ['read', 'Read Genesis 6:9-22 together before bed.'],
      ['verse', 'Practise Genesis 6:22.'],
    ],
  },
  {
    ref: 'Genesis 8-9',
    summary: 'After the flood, God put a rainbow in the sky as His promise never to flood the whole earth again. This lesson shows that God always keeps His promises.',
    verse: 'I do set my bow in the cloud, and it shall be for a token of a covenant between me and the earth.',
    verseRef: 'Genesis 9:13',
    prayer: 'Dear God, thank You for keeping Your promises. Thank You for rainbows that remind us of Your love. Amen.',
    tasks: [
      ['talk', 'What does the rainbow remind us about God?'],
      ['read', 'Read Genesis 9:8-17 together before bed.'],
      ['do', 'Draw a rainbow and write one of God’s promises on each colour.'],
      ['verse', 'Say Genesis 9:13 together three times this week.'],
    ],
  },
  {
    ref: 'Genesis 11:1-9',
    summary: 'The people of Babel tried to build a tower to make a name for themselves. This lesson is about pride, and why God wants us to be humble and give Him the glory.',
    verse: 'Humble yourselves in the sight of the Lord, and he shall lift you up.',
    verseRef: 'James 4:10',
    prayer: 'Lord, help us not to show off or think we are better than others. Everything good we have comes from You. Amen.',
    tasks: [
      ['talk', 'Why did God not want the people to finish their tower?'],
      ['do', 'Build a tower together, then say one thing God helped each of you do this week.'],
      ['read', 'Read Genesis 11:1-9 together.'],
      ['verse', 'Practise James 4:10.'],
    ],
  },
  {
    ref: 'Genesis 22:1-14',
    summary: 'Abraham trusted God with the thing he loved most, and God provided a ram on the mountain. This lesson is about faith that trusts God to provide.',
    verse: 'And Abraham said, My son, God will provide himself a lamb for a burnt offering: so they went both of them together.',
    verseRef: 'Genesis 22:8',
    prayer: 'Dear God, thank You that You always provide what we need. Help us trust You like Abraham did. Amen.',
    tasks: [
      ['talk', 'What is something we can trust God to provide for our family?'],
      ['talk', 'How do you think Isaac felt walking up the mountain?'],
      ['read', 'Read Genesis 22:1-14 together.'],
      ['verse', 'Practise Genesis 22:8.'],
    ],
  },
  {
    ref: 'Genesis 28:10-22',
    summary: 'Running from home, Jacob dreamed of a ladder reaching to heaven, and God promised to be with him everywhere he went. This lesson is about God being with us wherever we are.',
    verse: 'And, behold, I am with thee, and will keep thee in all places whither thou goest.',
    verseRef: 'Genesis 28:15',
    prayer: 'Thank You, God, that You are with us at home, at school and everywhere we go. Help us remember You are always near. Amen.',
    tasks: [
      ['talk', 'Where do you most need to remember that God is with you?'],
      ['do', 'Draw Jacob’s ladder and write Genesis 28:15 at the top.'],
      ['read', 'Read Genesis 28:10-22 together.'],
      ['verse', 'Practise Genesis 28:15.'],
    ],
  },
  {
    ref: 'Psalm 119:105',
    summary: 'The Bible is God speaking to us. This lesson is about reading God’s Word every day and letting it show us the way, like a torch on a dark path.',
    verse: 'Thy word is a lamp unto my feet, and a light unto my path.',
    verseRef: 'Psalm 119:105',
    prayer: 'Lord, thank You for the Bible. Help us read it, remember it and do what it says. Amen.',
    tasks: [
      ['talk', 'What is your favourite Bible story, and why?'],
      ['do', 'Turn the lights off and walk a short path with a torch, then talk about how God’s Word lights our way.'],
      ['read', 'Read Psalm 119:105-112 together.'],
      ['verse', 'Practise Psalm 119:105.'],
    ],
  },
  {
    ref: 'Psalm 122',
    summary: 'Worship is how we tell God we love Him, with songs, prayers, giving and listening. This lesson is about coming to church glad and ready to meet with God.',
    verse: 'I was glad when they said unto me, Let us go into the house of the LORD.',
    verseRef: 'Psalm 122:1',
    prayer: 'Dear God, we love You. Help us come to church with happy hearts, ready to sing, pray and learn. Amen.',
    tasks: [
      ['talk', 'What is your favourite part of Sunday service?'],
      ['do', 'Sing a worship song together as a family one evening this week.'],
      ['read', 'Read Psalm 122 together.'],
      ['verse', 'Practise Psalm 122:1.'],
    ],
  },
  {
    ref: 'Psalm 133',
    summary: 'The church is God’s family, and we belong to it. This lesson is about loving, helping and praying for the people we worship with.',
    verse: 'Behold, how good and how pleasant it is for brethren to dwell together in unity!',
    verseRef: 'Psalm 133:1',
    prayer: 'Thank You, God, for our church family. Help us be kind, share and look after one another. Amen.',
    tasks: [
      ['talk', 'Who in our church family could we pray for this week?'],
      ['do', 'Make a thank you card for a Sunday School teacher.'],
      ['read', 'Read Psalm 133 together.'],
      ['verse', 'Practise Psalm 133:1.'],
    ],
  },
  {
    ref: 'Jeremiah 3:15',
    summary: 'God gives His church pastors to teach and care for His people. This lesson is about listening to God’s Word through our pastor and praying for him.',
    verse: 'And I will give you pastors according to mine heart, which shall feed you with knowledge and understanding.',
    verseRef: 'Jeremiah 3:15',
    prayer: 'Lord, thank You for our pastor. Give him strength and wisdom, and help us listen and learn. Amen.',
    tasks: [
      ['talk', 'What is one thing you remember from what the pastor said?'],
      ['do', 'Pray together for the pastor and his family one night this week.'],
      ['read', 'Read Jeremiah 3:15 and 1 Peter 5:2-4 together.'],
      ['verse', 'Practise Jeremiah 3:15.'],
    ],
  },
  {
    ref: 'Psalm 118:24',
    summary: 'Learning about God is a joy. This lesson celebrates Sunday School with games, songs and friends, and remembers that every day is a gift from God.',
    verse: 'This is the day which the LORD hath made; we will rejoice and be glad in it.',
    verseRef: 'Psalm 118:24',
    prayer: 'Thank You, God, for today and for Sunday School. Help us be glad and thankful every day. Amen.',
    tasks: [
      ['talk', 'What was the most fun thing you did in Sunday School?'],
      ['do', 'Play a Bible game from the kids’ portal together.'],
      ['read', 'Read Psalm 118:24-29 together.'],
      ['verse', 'Practise Psalm 118:24.'],
    ],
  },
  {
    ref: 'Luke 2:41-52',
    summary: 'Even Jesus grew up. He grew taller and wiser and closer to God and to people. This lesson is about growing in faith together as a family.',
    verse: 'And Jesus increased in wisdom and stature, and in favour with God and man.',
    verseRef: 'Luke 2:52',
    prayer: 'Dear God, help our family grow closer to You and to each other, a little more every day. Amen.',
    tasks: [
      ['talk', 'How have you grown this year, in your body and in your faith?'],
      ['do', 'Mark everyone’s height on a wall chart and pray for each other.'],
      ['read', 'Read Luke 2:41-52 together.'],
      ['verse', 'Practise Luke 2:52.'],
    ],
  },
]
