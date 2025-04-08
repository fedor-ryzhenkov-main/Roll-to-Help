import { PrismaClient } from '@prisma/client'
import { addMinutes } from 'date-fns' // Ensure date-fns is imported

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')
  
  // Clean up existing data first to avoid conflicts
  console.log('Deleting existing bids...')
  await prisma.bid.deleteMany()
  console.log('Deleting existing games...')
  await prisma.game.deleteMany()
  console.log('Deleting existing events...')
  await prisma.event.deleteMany()

  // Define the event date details - make it relative for easier testing
  const eventDate = addMinutes(new Date(), 60 * 24); // Example: Event starts 1 day from now
  // Set the specific auction end date: April 22nd, 18:00 Tbilisi (UTC+4)
  const auctionEndDate = new Date('2024-04-22T14:00:00Z'); 
  console.log(`Setting event end date to: ${auctionEndDate.toISOString()} (April 22, 18:00 GET)`);

  // Create the Roll to Help charity event
  console.log('Creating the Roll to Help event...');
  const event = await prisma.event.create({
    data: {
      name: 'Roll to Help',
      description: 'Благотворительный вечер Dungeons & Dragons и других настольно-ролевых игр в поддержку фонда Choose to Help.',
      location: 'Клуб настольных игр Mesto (Технический Университет)',
      eventDate: eventDate, // Use the calculated date
      endDate: auctionEndDate, // SET THE EVENT END DATE HERE
      imageUrl: '/images/events/roll-to-help-banner.jpg', // Placeholder image URL
      isActive: true,
    },
  });
  console.log(`Created event with ID: ${event.id}`);

  // Define the games based on provided text
  const gamesData = [
    {
      name: 'Раз, два, три — замри.',
      description: 'Сказки окружают нас повсюду: они таятся в тёмной воде колодцев, шелестят в солнечных полях и крадутся по мрачным лесам. Исполинский Чугайстирь бродит по своим лесным владениям, жадные скарбники чахнут над сокровищами, а коварные бохинки по ночам окружают колыбели. Эти сказки вплетены в мироздание шёлком надежды и канатами страха, но многие о них позабыли, разучились в них верить. На границе чувств сказки всё ещё любят, ненавидят, злятся, боятся и мстят. Только вы можете их видеть. Только вы чувствуете их. Только вы сможете спасти нас.',
      system: 'Vaessen',
      genre: 'Детективный триллер в глубинных сёлах 18-го века',
      imageUrl: '/games/замри-logo.png', 
      totalSeats: 4,
      startingPrice: 40, 
      minBidIncrement: 10, 
    },
    {
      name: 'Домашняя вечеринка!',
      description: 'Вы почти никого здесь не знаете, а всю ночь провели, сидя в саду и разговаривая с одними и теми же людьми. Это, конечно, очень весело, но теперь вам крайне нужно пописать, прежде чем отправиться домой. Загвоздка в том, что вечеринка стала довольно бурной: если вы не уйдёте в ближайшее время, вас заставят убираться! Вы понятия не имеете, где находится туалет, а здание, по-видимому, спроектировано пьяным человеком. Удачи!',
      system: 'Тройка!', 
      genre: 'Безумное фентези в вечно изменяющемся городе на стыке всех миров и хлебных корочек. Быстрая генерация персонажей перед игрой, OSR.',
      imageUrl: '/games/вечеринка-logo.jpg', 
      totalSeats: 6, 
      startingPrice: 40,
      minBidIncrement: 10,
    },
    {
      name: 'Де Вицце в беде!',
      description: 'В поисках приключений или лёгкой наживы вы пустились в путь, чтобы завоевать себе славу мечом и магией. Но дела идут не так хорошо. Лучшее, что вам удалось найти, — это должность охраны у одного вельможи, чьи эксцентричные запросы становятся всё более несуразными, особенно после того, как он обрёл новую даму сердца, которую непременно хочет завоевать. Bonjour, mon ami~',
      system: 'Dungeons & Dragons',
      genre: 'Весёлый фэнтезийный сюжет в самой популярной игровой системе.', // Note: D&D mentioned again here, might refine genre text
      imageUrl: '/games/девице-logo.jpg', 
      totalSeats: 6, 
      startingPrice: 40,
      minBidIncrement: 10,
    },
    {
      name: 'Незабудка',
      description: '10 лет прошло. Вы —друзья, что не виделись, кажется, вечность. Однако вас объединяет общее дело: вы — тестировщики, и, собираясь вновь и вновь в играх, вы наконец добрались до виртуальной вселенной, чтобы воочию увидеть то, что было… Понять, чем стали все упущения в ваших жизнях. Новая VR-сессия — шанс поделиться прошлым, но симуляция работает не совсем точно. Мемория — некий феномен в игре, и вам необходимо узнать его природу, при возможности произвести фикс и составить отчёт. Каждое решение — шаг к правде или новой неточности этой вселенной.',
      system: 'Monsterhearts',
      genre: 'Психологическая фантастика о друзьях, которых разлучили годы, но объединила симуляция.',
      imageUrl: '/games/незабудка-logo.jpg', 
      totalSeats: 3,
      startingPrice: 40,
      minBidIncrement: 10,
    },
  ]

  // Create the games associated with the event
  console.log(`Creating ${gamesData.length} games for event ${event.id}...`)
  for (const game of gamesData) {
    await prisma.game.create({
      data: {
        ...game,
        eventId: event.id,
      },
    })
  }
  console.log('Games created successfully.')

  // Remove the old bid creation and updateWinningBids logic for a clean seed
  // if (game) { ... }
  // async function updateWinningBids(...) { ... }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    console.log('Disconnecting Prisma Client...')
    await prisma.$disconnect()
  })

// This is needed for ESM compatibility
export {} 