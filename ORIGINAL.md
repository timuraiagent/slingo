Ниже — **полная расширенная спецификация игры** без привязки к MVP. Это уже не “первый прототип”, а **полный vision-документ** со всеми основными, продвинутыми и потенциальными фичами.

---

# 1. Назначение документа

Этот документ описывает полную концепцию мобильной игры-гибрида, сочетающей:

- бинго-карточки
    
- слот-механику
    
- тайминг-скилл
    
- турнирную гонку
    
- систему бонусных шаров
    
- мета-прогрессию
    
- PvP/PvE/ивентные режимы
    
- долгосрочную LiveOps-структуру
    

Цель игры — создать новый поджанр на стыке:

- social bingo
    
- slot-driven engagement
    
- reactive skill gameplay
    
- short tournament competition
    

---

# 2. Рабочее название

Основное рабочее название:

**Skill Bingo Slots**

Альтернативы:

- Spin & Mark
    
- Reel Bingo Clash
    
- Jackpot Bingo Rush
    
- Bingo Tournament Slots
    
- Reel Race Bingo
    
- Lucky Line Arena
    

---

# 3. High Concept

Игрок участвует в матчах в вертикальной ориентации.  
В верхней части экрана находятся одна или несколько бинго-карточек.  
В нижней части — слот-машина, генерирующая числа, специальные шары, бустеры, эффекты и события.

Игрок:

- наблюдает за своей карточкой
    
- отслеживает, какие числа нужны
    
- управляет моментом спина через тайминг-механику
    
- получает шары
    
- закрывает клетки
    
- копит комбо и бонусы
    
- использует jackpot-шары и спецэффекты
    
- соревнуется с другими игроками, кто быстрее соберет нужный паттерн
    

Главная идея:  
**игрок не просто ждет случайного бинго, а активно влияет на его темп, направление и критические моменты.**

---

# 4. Жанр

## Основной жанр

- mobile hybrid casual/midcore
    

## Поджанры

- skill bingo
    
- tournament race
    
- slot-powered board progression
    
- reactive number-chasing game
    
- live competition casual strategy
    

---

# 5. Фантазия игрока

Игрок должен ощущать:

- азарт спина
    
- понятный визуальный прогресс по карточке
    
- момент контроля через тайминг
    
- эмоцию “я вытащил нужное число”
    
- напряжение гонки против других
    
- значимость решений, связанных с бонусными шарами
    
- чувство, что хорошая игра может перевесить чистую удачу
    
- серию ярких “clutch moments”
    

---

# 6. Платформа и формат

## Платформа

- iOS
    
- Android
    

## Ориентация

- только portrait / vertical
    

## Формат управления

- one-hand friendly
    
- крупные зоны тапа
    
- минимальная зависимость от сложных жестов
    
- быстрые решения и короткие циклы внимания
    

---

# 7. Core Pillars

## 7.1 Slot Juiciness

Слот должен давать ощущение:

- энергии
    
- ожидания
    
- всплесков дофамина
    
- награды за удачные результаты
    

## 7.2 Bingo Clarity

Бинго-карточка должна оставаться:

- легко читаемой
    
- понятной
    
- зрительно доминирующей в части стратегической цели
    

## 7.3 Skill Agency

Игрок должен ощущать, что:

- timing matters
    
- решения по jackpot matter
    
- серия успехов имеет значение
    
- даже промахи не всегда ощущаются пустыми
    

## 7.4 Competitive Tension

Матч должен создавать:

- лидерскую гонку
    
- предфинишное напряжение
    
- ощущение “я почти догнал”
    
- драму конца матча
    

## 7.5 Layered Depth

Игра должна быть:

- простой для старта
    
- глубокой в долгую
    
- расширяемой через события, режимы, мету и спецсистемы
    

---

# 8. Основной цикл игры

## Macro loop

1. игрок заходит в игру
    
2. получает награды / открывает события / выбирает режим
    
3. входит в матч или турнир
    
4. получает карточки
    
5. играет, крутя слот и закрывая клетки
    
6. использует бонусы и спец-ресурсы
    
7. завершает матч
    
8. получает награды, прогресс, рейтинговые очки, ресурсы
    
9. возвращается в мета-слой
    
10. открывает новые механики / карточки / режимы / косметику / события
    
11. запускает следующий матч
    

## Match loop

1. анализ нужных чисел
    
2. отслеживание тайминг-шкалы
    
3. нажатие spin
    
4. прокрутка рилов
    
5. определение результата
    
6. применение числа / бонуса / промаха
    
7. обновление карточки, streak, meters, позиции
    
8. принятие решения по активным ресурсам
    
9. повтор до конца матча
    

---

# 9. Основные сущности системы

В игре существуют следующие главные сущности:

- игрок
    
- матч
    
- турнир
    
- бинго-карточка
    
- клетка
    
- число
    
- линия / паттерн
    
- слот-спин
    
- timing result
    
- шар
    
- бонусный шар
    
- jackpot-шар
    
- super jackpot-шар
    
- streak
    
- combo
    
- meter
    
- skill modifier
    
- booster
    
- event modifier
    
- rank / leaderboard entry
    
- meta progression state
    
- currency
    
- ticket / entry resource
    
- season / league state
    

---

# 10. Экранная структура

Основной игровой экран делится на функциональные зоны.

## 10.1 Top HUD

Содержит:

- позицию игрока
    
- размер лобби / число оставшихся соперников
    
- цель матча
    
- таймер
    
- иконки статусов
    
- меню / пауза
    

## 10.2 Bingo Zone

Содержит:

- одну или несколько карточек
    
- прогресс по линиям / паттернам
    
- выделения
    
- подсказки
    
- анимации закрытий
    
- статусы бонусов на клетках
    

## 10.3 Skill Zone

Содержит:

- timing bar
    
- бегущий маркер
    
- зоны точности
    
- активные окна усилений
    
- streak meter
    
- jackpot meter
    
- дополнительные модификаторы timing-based эффектов
    

## 10.4 Slot Zone

Содержит:

- барабаны
    
- символы
    
- итоговый шар / число
    
- визуализацию спец-результатов
    
- состояние рилов
    
- режимы усиления / перегрева / event takeover
    

## 10.5 Control Zone

Содержит:

- Spin
    
- Fast / Turbo / Auto
    
- Jackpot / Special
    
- Booster access
    
- contextual action buttons
    

## 10.6 Informational overlays

Могут показывать:

- лидерский прогресс
    
- pressure phase
    
- event phase
    
- near-win warnings
    
- активные спецэффекты
    
- tutorial hints
    

---

# 11. Бинго-карточки

## 11.1 Формат карточек

Базовый формат:

- 5x5
    

Дополнительные возможные форматы:

- 4x4
    
- 6x6
    
- 7x7
    
- мини-карты
    
- асимметричные карты
    
- тематические фигурные карты
    

## 11.2 Количество карточек

Игрок может играть:

- с одной карточкой
    
- с несколькими карточками одновременно
    
- с переключаемыми активными карточками
    
- с layered / stacked карточками
    
- с side-by-side карточками
    
- с rotating card pools
    

## 11.3 Типы клеток

- обычная клетка
    
- закрытая клетка
    
- заблокированная клетка
    
- усиленная клетка
    
- заряженная клетка
    
- горячая клетка
    
- ледяная клетка
    
- cursed клетка
    
- wildcard клетка
    
- event клетка
    
- boss клетка
    
- jackpot-помеченная клетка
    
- hidden клетка
    
- shielded клетка
    
- trap клетка
    

## 11.4 Free cell

Варианты:

- отсутствует
    
- одна центральная free cell
    
- случайные free cells
    
- временно разблокируемые free cells
    
- earnable free cells
    
- conditional free cells
    

## 11.5 Генерация карточек

Карточки могут:

- генерироваться случайно
    
- балансироваться под матч
    
- зависеть от режима
    
- зависеть от редкости / темы / сезона
    
- зависеть от прогресса игрока
    
- быть кастомизируемыми до матча
    
- иметь уникальные “архетипы”
    

## 11.6 Архетипы карточек

Примеры:

- balanced card
    
- cluster card
    
- corner-heavy card
    
- central-heavy card
    
- line-friendly card
    
- high-risk spread card
    
- event-adapted card
    
- rare collectible card
    

---

# 12. Победные паттерны

## 12.1 Линейные

- одна строка
    
- один столбец
    
- одна диагональ
    
- две линии
    
- три линии
    

## 12.2 Стандартные бинго-паттерны

- corners
    
- X
    
- plus
    
- box
    
- outer ring
    
- center square
    
- cross
    
- ladder
    
- zigzag
    

## 12.3 Продвинутые

- blackout
    
- asymmetrical figure
    
- dynamic event figure
    
- race checkpoints
    
- multi-stage patterns
    
- layered patterns across multiple cards
    

## 12.4 Паттерны по фазам

Матч может иметь:

- одну цель с начала до конца
    
- смену паттернов по фазам
    
- escalating targets
    
- secondary objective
    
- hidden objective
    
- tie-breaker pattern
    

---

# 13. Числовая система

## 13.1 Диапазоны

Возможные диапазоны:

- 1–30
    
- 1–50
    
- 1–60
    
- 1–75
    
- 1–90
    
- тематические диапазоны
    
- event-диапазоны
    

## 13.2 Числовые кластеры

Можно использовать:

- обычную равномерную выдачу
    
- региональные группы
    
- column-based distribution
    
- weighted useful targeting
    
- seasonal number pools
    

## 13.3 Умные веса

Система может:

- повышать шанс нужных чисел
    
- повышать шанс near-hit чисел
    
- учитывать текущий прогресс линии
    
- учитывать место игрока
    
- учитывать фазу матча
    
- учитывать активные модификаторы
    

---

# 14. Слот-механика

## 14.1 Структура

Слот состоит из:

- рилов
    
- символов
    
- стоп-логики
    
- result extraction layer
    
- bonus event layer
    
- animation layer
    
- modifier layer
    

## 14.2 Конфигурации рилов

Возможные форматы:

- 3x3
    
- 5x3
    
- 5x4
    
- 5x5
    
- 6x3
    
- dynamic expanding reels
    
- collapsing reels
    
- event reels
    
- boss reels
    

## 14.3 Типы символов на рилах

- числа
    
- числа с бонусными тегами
    
- jackpot symbols
    
- wild symbols
    
- scatter-like symbols
    
- multiplier symbols
    
- meter symbols
    
- combo color symbols
    
- trap symbols
    
- event tokens
    
- boss tokens
    
- utility tokens
    

## 14.4 Output логика

Результат спина может быть:

- одно итоговое число
    
- одно число + modifier
    
- одно число + bonus ball
    
- multiple balls
    
- one number per highlighted reel
    
- selected reel outcome
    
- aggregate reel outcome
    
- chain outcome
    

## 14.5 Темп спина

- normal
    
- fast
    
- turbo
    
- instant
    
- cinematic
    
- boss speed
    
- sudden death speed
    

## 14.6 Спец-состояния слота

- overdrive
    
- hot reels
    
- frozen reel
    
- cursed reel
    
- locked reel
    
- glowing reel
    
- bonus reel
    
- mirror reel
    
- echo reel
    
- split reel
    
- mutating reel
    

---

# 15. Timing Mechanic

## 15.1 Базовая идея

Между бинго и слотом есть timing bar, по которой движется маркер.

Игрок нажимает Spin в попытке поймать:

- нужное число
    
- нужную группу
    
- нужную линию
    
- event window
    
- bonus timing zone
    

## 15.2 Типы timing bar

- линейная шкала по числам
    
- дуговая шкала
    
- кольцевая шкала
    
- oscillating bar
    
- segmented number rail
    
- dual bar
    
- layered bar
    
- adaptive bar
    

## 15.3 Зоны точности

- Perfect
    
- Great
    
- Good
    
- Close
    
- Miss
    

## 15.4 Результаты timing

Timing может влиять на:

- шанс target number
    
- шанс adjacent number
    
- шанс useful number
    
- шанс bonus ball
    
- шанс множителя
    
- заряд meters
    
- активацию combo
    
- protection from miss
    
- jackpot generation
    

## 15.5 Adaptive timing

Система может:

- ускоряться
    
- замедляться
    
- менять размер perfect zone
    
- искажаться в pressure phase
    
- усиливаться бустерами
    
- упрощаться для отстающих игроков
    
- усложняться для лидеров
    
- меняться от режима к режиму
    

## 15.6 Advanced timing modes

- delayed release timing
    
- hold-and-release timing
    
- dual tap timing
    
- combo timing
    
- precision burst timing
    
- line target timing
    
- color timing
    
- phase matching timing
    

---

# 16. Типы шаров

Шары — центральная сущность, связывающая слот и карточку.

## 16.1 Обычные шары

- стандартный числовой шар
    
- закрывает соответствующую клетку
    

## 16.2 Near-hit шары

- не закрывают клетку напрямую
    
- заряжают meters
    
- дают partial progress
    
- подсвечивают цели
    

## 16.3 Jackpot Ball

- позволяет закрыть любую клетку
    
- активируется вручную
    

## 16.4 Super Jackpot Ball

- живет ограниченное число спинов/секунд
    
- требует выбора
    
- при просрочке исчезает или падает случайно
    

## 16.5 Multi-hit Ball

- закрывает несколько клеток
    
- или дает несколько попыток выбора
    

## 16.6 Line Ball

- работает только для выбранной линии
    
- усиливает определенную строку/столбец/диагональ
    

## 16.7 Cluster Ball

- влияет на соседние клетки
    
- особенно полезен в card modes с proximity logic
    

## 16.8 Echo Ball

- повторяет предыдущий результат
    
- возвращается через N спинов
    

## 16.9 Freeze Ball

- замораживает клетку / линию / эффект
    

## 16.10 Shield Ball

- дает защиту выбранной клетке или линии
    

## 16.11 Steal Ball

- взаимодействует с соперником
    
- крадет прогресс или ресурс
    

## 16.12 Spy Ball

- раскрывает состояние соперника
    

## 16.13 Curse Ball

- временно осложняет игру противнику или самому игроку как event effect
    

## 16.14 Wild Ball

- считается любым числом
    
- может быть ограничен по области применения
    

## 16.15 Sequence Ball

- усиливает серию попаданий
    
- продлевает streak
    

## 16.16 Color Balls

- красные
    
- синие
    
- зеленые
    
- золотые
    
- фиолетовые
    
- тематические  
    Их цвет может участвовать в combo-системах.
    

---

# 17. Бонусные системы и meters

## 17.1 Jackpot Meter

Заполняется от:

- useful hits
    
- perfect timing
    
- near hits
    
- combos
    
- event modifiers
    

Награда:

- jackpot ball
    
- super jackpot
    
- random tactical reward
    

## 17.2 Streak Meter

Отслеживает серию удачных действий.

Награды:

- jackpot
    
- multiplier
    
- overdrive
    
- speed phase
    
- combo unlock
    

## 17.3 Pressure Meter

Отражает интенсивность текущего матча.

Может активировать:

- fast endgame
    
- enhanced odds
    
- visual warning
    
- clutch bonus
    

## 17.4 Heat Meter

Накапливается от skillful play.

Может давать:

- hot zones
    
- hot reel
    
- enhanced timing control
    
- bonus target assistance
    

## 17.5 Combo Meter

Отвечает за цепочки символов/цветов/типов шаров.

## 17.6 Chaos Meter

Используется в event/roguelike режимах для активации случайных глобальных модификаторов.

---

# 18. Система streak и combo

## 18.1 Streak

Streak строится на:

- подряд useful hits
    
- подряд perfect timings
    
- попадания в один и тот же паттерн
    
- успешное использование ресурсов
    

Streak может:

- усиливать награды
    
- повышать шанс бонусных шаров
    
- улучшать bias системы
    
- открывать временные спецрежимы
    

## 18.2 Combo

Combo может строиться на:

- цветах шаров
    
- типах символов
    
- последовательностях чисел
    
- spatial patterns
    
- timing quality chains
    
- multi-card interactions
    

Примеры combo-наград:

- random mark
    
- bonus jackpot charge
    
- temporary overdrive
    
- target reveal
    
- multiplier
    
- shield
    
- extra spin
    

---

# 19. Полезные, частично полезные и бесполезные результаты

## 19.1 Useful Hit

Результат дает прямой прогресс:

- закрывает клетку
    
- завершает линию
    
- продвигает паттерн
    
- создает важную цепочку
    

## 19.2 Near Useful

Результат не закрывает клетку, но:

- заряжает meter
    
- дает combo credit
    
- подсвечивает line pressure
    
- снижает шанс полного провала
    
- подготавливает будущий payoff
    

## 19.3 Useless

Результат не дает прямого прогресса.

Система должна следить, чтобы useless streaks не были слишком длинными.

---

# 20. Anti-frustration systems

## 20.1 Pity logic

После серии пустых спинов:

- растет шанс полезного исхода
    
- растет шанс near useful
    
- увеличивается целевой bias
    

## 20.2 Catch-up assist

Для отстающих игроков:

- slightly increased useful odds
    
- larger timing forgiveness
    
- bonus meter drip
    
- comeback events
    

## 20.3 Soft fail reward

Даже промах может:

- дать meter
    
- дать token
    
- продвинуть side objective
    
- дать combo fragment
    

## 20.4 Bad luck insurance

Игрок может копить страховку, которая срабатывает после серии неудач.

---

# 21. Jackpot-система

## 21.1 Простая jackpot-модель

- один meter
    
- один reward type
    
- любой выбор клетки
    

## 21.2 Тактическая jackpot-модель

Игрок выбирает:

- куда ставить
    
- сейчас или позже
    
- сохранить или конвертировать
    
- применять на своей или турнирной цели
    

## 21.3 Expanded jackpot variants

- line jackpot
    
- random triple jackpot
    
- delayed jackpot
    
- expiring jackpot
    
- shared team jackpot
    
- mirrored jackpot
    
- chain jackpot
    

## 21.4 Jackpot economy

Jackpot может:

- копиться
    
- стекаться
    
- конвертироваться
    
- улучшаться
    
- прокачиваться в мета-слое
    

---

# 22. Способности игрока

Игрок может иметь активные или пассивные способности.

## 22.1 Активные

- use jackpot
    
- use shield
    
- use heat zones
    
- line target
    
- prediction
    
- reshuffle card
    
- save ball
    
- lock line
    
- reroll spin
    
- freeze cursor
    
- widen perfect zone
    
- activate overdrive
    
- reveal needed cluster
    

## 22.2 Пассивные

- increased near-hit reward
    
- faster meter gain
    
- more forgiving timing
    
- safer streak preservation
    
- improved comeback chance
    
- bonus on first completed line
    
- extra reward from combo balls
    

---

# 23. Карточные спец-механики

## 23.1 Shuffle

Игрок может перетасовать карточку.

Варианты:

- полная перетасовка
    
- частичная перетасовка
    
- только незакрытых клеток
    
- только выбранного сектора
    
- с ценой или кулдауном
    

## 23.2 Card Lock

Игрок блокирует карточку или часть карточки от негативных эффектов.

## 23.3 Card Shift

Карточка сдвигает распределение чисел.

## 23.4 Hidden Card

Часть чисел скрыта до раскрытия.

## 23.5 Evolving Card

Карточка изменяется по ходу матча.

## 23.6 Multi-layer Card

Одна клетка может требовать несколько попаданий.

## 23.7 Card Traits

Карточки могут иметь особенности:

- more corners
    
- more center density
    
- higher synergy with color balls
    
- easier combo chains
    
- fragile but explosive
    
- defensive
    
- jackpot-focused
    

---

# 24. Tournament systems

## 24.1 Матчевые турниры

- short bracketless lobbies
    
- timed races
    
- position-based payouts
    

## 24.2 Ranked tournaments

- MMR
    
- leagues
    
- seasons
    
- promotion / demotion
    
- rank protection
    
- ranked-only modifiers
    

## 24.3 Entry-based tournaments

- coin entry
    
- ticket entry
    
- premium tournament entry
    
- special event passes
    

## 24.4 Async tournaments

Игрок играет against ghost progression / asynchronous standings.

## 24.5 Real-time tournaments

Обновление лидерства идет live.

## 24.6 Multi-round tournaments

- qualifiers
    
- semi-finals
    
- finals
    
- gauntlet ladders
    

## 24.7 Elimination modes

- bottom players drop out
    
- sudden death phases
    
- zone-based shrinking win conditions
    

---

# 25. PvP interaction systems

## 25.1 Soft PvP

- leaderboard race
    
- pressure phase
    
- visual proximity
    
- position steals only by score
    

## 25.2 Medium PvP

- denial mechanics
    
- temporary blocks
    
- limited interference
    
- shared resources competition
    

## 25.3 Hard PvP

- steal ball
    
- remove mark
    
- line corruption
    
- jam reel
    
- invert opponent timing
    
- curse targeted player
    
- disrupt jackpot
    
- freeze opponent action
    

## 25.4 Visibility rules

PvP systems требуют решения:

- видно ли чужие карточки
    
- виден ли точный прогресс
    
- видны ли активные эффекты
    
- есть ли fog of war
    
- есть ли reveal mechanics
    

---

# 26. Pressure and comeback systems

## 26.1 Pressure phase

Когда кто-то близок к победе:

- ускоряется темп
    
- меняется звук
    
- усиливается визуальная подача
    
- растет шанс clutch mechanics
    
- появляется “finish tension”
    

## 26.2 Comeback window

Отстающим игрокам могут даваться:

- enhanced near hits
    
- wider timing zones
    
- faster jackpot charge
    
- one-time rescue effect
    

## 26.3 Last Chance phase

В конце матча:

- повышенная скорость
    
- reduced cooldowns
    
- bonus odds
    
- sudden-death pattern
    

---

# 27. Режимы игры

## 27.1 Classic Tournament

Стандартная гонка на паттерн.

## 27.2 Full Bingo

Победа по полному заполнению.

## 27.3 Blitz

Очень быстрые матчи.

## 27.4 Marathon

Длинные матчи с несколькими этапами.

## 27.5 Multi-card Frenzy

Игра с несколькими карточками.

## 27.6 Boss Mode

Игрок или группа игроков против общего босса.

## 27.7 Duel Mode

1v1 с более выраженным PvP.

## 27.8 Squad / Team Mode

Командные матчи.

## 27.9 Draft Mode

Игроки до матча выбирают карточки, способности, модификаторы.

## 27.10 Roguelike Run

Серия матчей с накоплением модификаторов.

## 27.11 Daily Challenge

Уникальные правила дня.

## 27.12 Event Mode

Сезонные правила и тематика.

## 27.13 Puzzle Mode

Заранее заданные карточки и условия.

## 27.14 Endless Climb

Progression tower / gauntlet.

---

# 28. Boss system

## 28.1 Общая идея

Вместо обычной гонки — матч против босса.

Босс может:

- накладывать негативные эффекты
    
- менять числа
    
- искажать timing bar
    
- блокировать клетки
    
- заражать рилы
    
- вводить фазы
    

## 28.2 Типы боссов

- reel boss
    
- number corruption boss
    
- freeze boss
    
- mirror boss
    
- chaos boss
    
- time pressure boss
    
- shield boss
    
- pattern scramble boss
    

## 28.3 Boss rewards

- rare cards
    
- cosmetics
    
- relics
    
- seasonal currency
    
- collectible reels
    
- bonus traits
    

---

# 29. Event systems

## 29.1 Limited-time events

- Halloween
    
- Lunar New Year
    
- Summer
    
- Tournament Festival
    
- Jackpot Storm
    
- Color Combo Week
    

## 29.2 Event modifiers

- double jackpot gain
    
- cursed numbers
    
- mirrored cards
    
- hot zones everywhere
    
- combo balls only
    
- pressure mode starts early
    
- rotating victory patterns
    

## 29.3 Collaborative community events

- global milestone
    
- serverwide unlock
    
- team tournament race
    

---

# 30. Редкость и коллекционирование

## 30.1 Collectible cards

Карточки могут быть:

- common
    
- rare
    
- epic
    
- legendary
    
- mythic
    

## 30.2 Collectible slot skins

- reel frames
    
- themes
    
- animated materials
    
- special stop effects
    

## 30.3 Collectible ball skins

- trails
    
- impacts
    
- glows
    
- sound styles
    

## 30.4 Collectible emblems / avatars / badges

Для статуса и турниров.

## 30.5 Collectible modifiers / relics

Пассивные свойства, влияющие на стиль игры.

---

# 31. Мета-прогрессия

## 31.1 Account progression

- level
    
- prestige
    
- mastery
    
- seasonal xp
    

## 31.2 Mechanic unlock progression

Открываются:

- новые режимы
    
- новые типы карточек
    
- новые бонусные шары
    
- новые boosters
    
- новые timing styles
    

## 31.3 Skill tree / upgrade tree

Игрок может вкладывать очки в:

- jackpot branch
    
- timing branch
    
- defense branch
    
- combo branch
    
- tournament branch
    
- comeback branch
    

## 31.4 Card mastery

Игрок развивает конкретные карточки/архетипы.

## 31.5 Reel mastery

Прогресс по стилям слот-механики.

## 31.6 Seasonal reset structures

Для ranked / leagues / passes.

---

# 32. Экономика

## 32.1 Валюты

Возможные валюты:

- Coins
    
- Gems
    
- Tickets
    
- Season currency
    
- Event currency
    
- Dust / crafting resource
    
- Upgrade cores
    
- Cosmetic tokens
    
- Ranked points
    

## 32.2 Источники

- матчевые награды
    
- daily rewards
    
- streak rewards
    
- quests
    
- achievements
    
- events
    
- pass
    
- shop
    
- social rewards
    

## 32.3 Траты

- вход в турниры
    
- покупка бустеров
    
- улучшение карточек
    
- улучшение способностей
    
- косметика
    
- rerolls
    
- event entry
    
- premium progression
    

## 32.4 Crafting

Игрок может:

- собирать fragments
    
- крафтить карточки
    
- улучшать relics
    
- объединять ресурсы в редкие формы
    

---

# 33. Boosters

## 33.1 Общие бустеры

- extra jackpot charge
    
- widen timing window
    
- extra near-hit value
    
- reroll spin
    
- extra card protection
    
- fast reel mode
    
- line lock
    
- reveal needed numbers
    

## 33.2 Match boosters

Используются внутри матча.

## 33.3 Pre-match boosters

Активируются до входа в матч.

## 33.4 Meta boosters

Постоянные или длительные эффекты.

## 33.5 Booster rarity

- common
    
- uncommon
    
- rare
    
- epic
    

---

# 34. Social systems

## 34.1 Friends

- friend list
    
- friend duels
    
- spectate
    
- send gifts
    

## 34.2 Clubs / Guilds

- club tournaments
    
- shared progression
    
- cooperative bosses
    
- club rewards
    

## 34.3 Spectator / replay

- watch finish moments
    
- replay clutch jackpot decisions
    
- share highlights
    

## 34.4 Emotes / reactions

- controlled, lightweight
    
- match-safe
    
- optional mute
    

---

# 35. Retention systems

## 35.1 Daily rewards

## 35.2 Streak login

## 35.3 Quests

- daily
    
- weekly
    
- event
    
- mastery quests
    

## 35.4 Collections

- complete set rewards
    
- theme albums
    
- season albums
    

## 35.5 Battle pass

- free + premium tracks
    
- cosmetics + resources + cards
    

## 35.6 Ranked seasons

- resets
    
- exclusive rewards
    
- end-season prestige
    

---

# 36. Difficulty layers

Игра должна иметь управляемую сложность.

## 36.1 New player layer

- меньше систем
    
- мягче timing
    
- проще цели
    
- fewer negative effects
    

## 36.2 Midgame layer

- больше карточек
    
- больше ресурсов
    
- больше tactical decisions
    

## 36.3 High skill layer

- tighter timing
    
- more PvP
    
- deeper drafting
    
- rank pressure
    
- complex event interactions
    

---

# 37. UX/UI принципы

## 37.1 Основные правила

Игрок всегда должен понимать:

- какие числа ему нужны
    
- что произошло после спина
    
- насколько он близок к цели
    
- какие бонусы активны
    
- что доступно нажать прямо сейчас
    

## 37.2 Обязательная визуальная иерархия

1. результат спина
    
2. бинго-прогресс
    
3. текущая возможность действия
    
4. турнирное положение
    
5. второстепенные эффекты
    

## 37.3 Анимационные принципы

- быстрые
    
- ясные
    
- не мешают чтению
    
- сильнее для редких событий
    
- не перегружают каждую мелочь одинаковой важностью
    

---

# 38. Audio design

## 38.1 Цели

- ощущение спина
    
- усиление полезного попадания
    
- драматизация конца матча
    
- distinct audio identity for jackpot moments
    

## 38.2 Слои

- reel spin
    
- reel stop
    
- result ping
    
- useful mark
    
- near hit
    
- combo build
    
- jackpot ready
    
- pressure phase
    
- victory / defeat
    
- boss warnings
    

---

# 39. Технические правила игрового баланса

## 39.1 RNG philosophy

Игра не должна быть:

- полностью детерминированной
    
- полностью хаотичной
    

Нужен контролируемый, подыгрывающий, но не очевидный RNG.

## 39.2 Bias system

Результат определяется с учетом:

- base RNG
    
- needed numbers
    
- timing quality
    
- streak state
    
- mode rules
    
- fairness caps
    
- anti-frustration constraints
    
- tournament pacing
    

## 39.3 Fairness caps

Нужны ограничения:

- максимальный degree of targeting
    
- максимальная длина fail streak
    
- ограничение runaway leader advantage
    
- ограничение infinite snowball systems
    

## 39.4 Readability of fairness

Игрок должен думать:

- “я мог повлиять”
    
- “мне немного не повезло, но игра не ломается”
    
- “я могу отыграться”
    

---

# 40. AI / bot / async support

Если используются не только живые оппоненты:

- асинхронные соперники
    
- призраки
    
- simulated standings
    
- difficulty-shaped opposition
    
- hybrid lobbies
    

Важно:

- поведение должно выглядеть естественно
    
- pacing должен казаться реальным
    
- нельзя допускать очевидных нечестных скачков
    

---

# 41. Accessibility

## 41.1 Визуальная

- крупные числа
    
- strong contrast
    
- colorblind-safe differentiation
    
- shape cues alongside color
    

## 41.2 Моторная

- большие tap targets
    
- optional slower modes
    
- reduced motion options
    

## 41.3 Когнитивная

- clear tutorials
    
- contextual guidance
    
- progressive complexity unlock
    
- clean language
    

---

# 42. Tutorial system

## 42.1 First-time tutorial

Показывает:

- карточку
    
- timing bar
    
- spin
    
- useful hit
    
- jackpot reward
    
- tournament goal
    

## 42.2 Layered tutorials

Новые системы обучаются по мере открытия:

- multi-card
    
- combo balls
    
- PvP
    
- bosses
    
- ranked
    
- card traits
    

## 42.3 Smart hint system

Во время игры может напоминать:

- где лучше использовать jackpot
    
- когда доступен активный ресурс
    
- что значит near hit
    
- почему идет pressure phase
    

---

# 43. Контентная масштабируемость

Игра должна легко расширяться без переделки ядра.

Расширяемые оси:

- режимы
    
- карточки
    
- паттерны
    
- типы шаров
    
- слоты/темы
    
- ивенты
    
- боссы
    
- сезоны
    
- клубы
    
- PvP-модификаторы
    
- battle pass content
    
- relic systems
    

---

# 44. Основные риски дизайна

## 44.1 Перегруз

Слишком много систем одновременно.

## 44.2 Потеря читаемости

Игрок не понимает, что произошло.

## 44.3 Слишком слабый skill

Timing feels fake.

## 44.4 Слишком сильный skill

Можно почти гарантировать числа.

## 44.5 Снежный ком

Лидер слишком рано становится недосягаем.

## 44.6 Токсичный PvP

Кражи и блоки убивают удовольствие.

## 44.7 Слишком длинные матчи

Пропадает мобильный ритм.

---

# 45. Продуктовая лестница фич

Ниже — естественная полная карта развития продукта.

## Core foundation

- cards
    
- slot
    
- timing
    
- useful hits
    
- streak
    
- jackpot
    
- tournaments
    

## Tactical depth

- multi-cards
    
- heat zones
    
- line targeting
    
- prediction
    
- ball cache
    
- overdrive
    

## Competitive depth

- ranked
    
- leagues
    
- draft
    
- duels
    
- soft PvP
    
- hard PvP variants
    

## Content depth

- events
    
- bosses
    
- seasonal modifiers
    
- collectible cards
    
- relic systems
    

## Social depth

- guilds
    
- replays
    
- spectate
    
- club races
    

## Meta depth

- skill trees
    
- crafting
    
- battle pass
    
- seasonal progression
    
- collection systems
    

---

# 46. Короткое ядро игры в одном абзаце

Это вертикальная мобильная турнирная игра, где игрок крутит слот, ловит нужные числа через тайминг, закрывает бинго-клетки, строит серии, использует jackpot-шары и соревнуется с другими за быстрый сбор линий, фигур, комбинаций и этапных целей, при этом игра постепенно раскрывает более глубокие системы — multi-card play, combo balls, pressure phases, bosses, ranked PvP, коллекционирование и сезонную мета-прогрессию.

---

# 47. Самая сильная формулировка vision

**Не просто бинго с красивым слотом и не просто слот с бинго-темой.  
Это игра про азартный ритм спина, управляемый таймингом, и тактическую гонку за паттерны на карточке.**

---

# 48. Практический вывод

Если смотреть на полную спецификацию как на продукт целиком, то у игры есть 6 крупных слоев:

1. **ядро матча** — слот, тайминг, карточка, числа
    
2. **тактика** — jackpot, streak, спец-шары, выборы
    
3. **турнирная гонка** — позиции, pressure, comeback
    
4. **режимы и контент** — patterns, bosses, events
    
5. **социальность и соревнование** — PvP, ranked, clubs
    
6. **мета и удержание** — прогресс, коллекции, battle pass, сезоны
    

---

Если хочешь, следующим сообщением я превращу это в **структуру “Game Design Document v1.0”** с нумерованными секциями, подзаголовками и уже более “производственным” стилем, как документ для команды, инвестора или студии.