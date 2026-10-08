// Ancient-world dossiers. Source and media research checked 8 October 2026.
window.ANCIENT_RECORDS = [
  {
    id: 'troy',
    title: 'Troy: a city beneath the epic',
    kicker: 'Legend meets excavation',
    hook: 'The city was real. How much of the story was?',
    year: 'Bronze Age · excavations from 1870',
    category: 'Ancient world',
    status: 'Archaeological find',
    summary: 'At Hisarlik in northwestern Turkey, excavations revealed successive cities, fortifications and a substantial Bronze Age settlement at the site identified as Troy. This gives the legendary setting a physical reality. Excavation director Manfred Korfmann reported evidence of destruction around 1180 BCE and argued that armed conflicts could lie behind the tradition. The ruins do not establish every episode in Homer. The compelling question is how real places and remembered conflicts became an epic populated by heroes, gods and a famous wooden horse. The archaeology opens that question; it does not close it.',
    facts: [
      'Hisarlik preserves thousands of years of settlement.',
      'Bronze Age fortifications and a lower settlement were excavated.',
      'Evidence of destruction does not identify a particular Homeric war.'
    ],
    limits: 'A real Troy does not verify Achilles, Helen, the wooden horse or every detail of the Iliad. Credit the longer excavation history, rather than a lone discovery myth.',
    sources: [
      { label: 'UNESCO: Archaeological Site of Troy', url: 'https://whc.unesco.org/en/list/849/' },
      { label: 'Excavation director: Was There a Trojan War?', url: 'https://archive.archaeology.org/0405/etc/troy.html' },
      { label: 'University of Cincinnati: Troy excavations and archive', url: 'https://www.uc.edu/news/articles/2026/07/uc-has-connection-to-city-of-legend-behind-odyssey.html' }
    ]
  },
  {
    id: 'vessels',
    title: 'The hard-stone vessel problem',
    kicker: 'Stonework before steel',
    hook: 'Hard stone. Hollow interiors. The surfaces hold the clues.',
    year: 'Example: c. 3100–2650 BCE',
    category: 'Ancient world',
    status: 'Experimental evidence',
    summary: 'Ancient Egyptian artisans hollowed and polished vessels from demanding stones. The pictured diorite jar is catalogued by The Met as Early Dynastic, around 3100–2650 BCE. Its material and compact form invite a close look at the work required. Archaeological drill cores, unfinished vessels, tool traces and experiments provide evidence for drilling and abrasive techniques. Denys Stocks tested early vessel-making methods; research at The Met identified a corundum-rich abrasive in a later Amarna drill hole. Exact processes and measured tolerances for particular objects remain questions worth investigating. Extraordinary craftsmanship is already established.\n\nA 2025 study compared scans of 19 Petrie Museum vessels with 49 modern vessels. Ancient interiors showed strong circularity but weaker concentricity, patterns the author interpreted as consistent with rotational grinding. Overall quality overlapped handmade comparators. The pictured Met jar was not measured.',
    facts: [
      'The pictured jar is diorite and only 5.7 cm high.',
      'Ancient workshop finds include drill cores and unfinished vessels.',
      'Experimental archaeology tests drilling with historically plausible materials.'
    ],
    limits: 'The sources do not establish that these vessels are impossible to reproduce today. Comparative geometry scores are not engineering tolerances. Proposed precision must be measured on authenticated objects; later abrasive evidence cannot automatically explain every earlier vessel.',
    sources: [
      { label: 'The Met: diorite jar, object 2021.41.59', url: 'https://www.metmuseum.org/art/collection/search/329827' },
      { label: 'Stocks, 1993: experimental vessel manufacture', url: 'https://doi.org/10.1017/S0003598X00045804' },
      { label: 'Fomitchev-Zamilov, 2025: vessel metrology study', url: 'https://www.nature.com/articles/s40494-025-02196-7' },
      { label: 'The Met: research on ancient drilling abrasives', url: 'https://www.metmuseum.org/perspectives/ancient-egyptian-technology' },
      { label: 'British Museum: drill cores and workshop evidence', url: 'https://www.britishmuseum.org/collection/object/X__4575' },
      { label: 'The Met: Open Access / CC0 policy', url: 'https://www.metmuseum.org/hubs/open-access' }
    ],
    image: 'assets/egyptian-diorite-vessel.jpg',
    imageAlt: 'Small ancient Egyptian diorite jar with two lugs and a hollow mouth, photographed against grey.',
    imageCredit: 'The Metropolitan Museum of Art, object 2021.41.59, Bequest of Nanette B. Kelekian, 2020. Public Domain / CC0.'
  },
  {
    id: 'pyramid-void',
    title: 'The spaces inside the Great Pyramid',
    kicker: 'Particles through stone',
    hook: 'Cosmic rays revealed spaces hidden inside the Great Pyramid.',
    year: 'Measured in 2017 and 2023',
    category: 'Ancient world',
    status: 'Measured discovery',
    summary: 'The Great Pyramid still contains structures that modern instruments can reveal without dismantling its stonework. In 2017, the ScanPyramids collaboration reported a void above the Grand Gallery with a minimum length of 30 metres. Three independent analyses using different muon detectors supported the finding. A separate North Face Corridor, behind the entrance chevrons, was precisely characterised in a 2023 paper as roughly nine metres long and two metres across. These are distinct features. Their detection is strong evidence of unseen architecture; the purpose and exact form of the Big Void require further investigation.',
    facts: [
      'The 2017 Big Void lies above the Grand Gallery.',
      'Three muon-detection technologies independently supported the finding.',
      'The 2023 North Face Corridor is a separate feature.'
    ],
    limits: 'A measured void is not evidence of treasure or a hidden civilisation. The 2017 paper did not establish its intended purpose. The photograph shows the Giza complex, not the void itself.',
    sources: [
      { label: 'Nature, 2017: discovery of the Big Void', url: 'https://www.nature.com/articles/nature24647' },
      { label: 'Nature Communications, 2023: North Face Corridor', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9981702/' },
      { label: 'Photograph: Ricardo Liberato / Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:All_Gizah_Pyramids.jpg' },
      { label: 'Image licence: CC BY-SA 2.0', url: 'https://creativecommons.org/licenses/by-sa/2.0/' }
    ],
    image: 'assets/giza-pyramids.jpg',
    imageAlt: 'A real photograph of the pyramids and subsidiary pyramids at Giza in daylight.',
    imageCredit: 'Ricardo Liberato, All Gizah Pyramids; Commons retouching by Ikiwaner. CC BY-SA 2.0. Wikimedia 1280 px thumbnail.'
  },
  {
    id: 'antikythera',
    title: 'The Antikythera mechanism',
    kicker: 'A sky in gears',
    hook: 'An ancient machine calculated celestial cycles with bronze gears.',
    year: 'Museum dating: c. 150–100 BCE',
    category: 'Ancient world',
    status: 'Archaeological find',
    summary: 'Recovered from a shipwreck in 1900–1901, the Antikythera mechanism survives as corroded bronze fragments. Imaging and inscriptions revealed an intricate astronomical calculator. Its gearing represented celestial and calendar cycles, including a system for predicting eclipse possibilities using the 223-month Saros cycle. The National Archaeological Museum places its creation around 150–100 BCE. Researchers have produced reconstructions, while missing parts leave aspects of the original design unsettled. Its power comes from what actually survives: a sophisticated mechanical expression of ancient astronomical knowledge, hidden for centuries in an apparently unremarkable mass of corrosion.',
    facts: [
      'Recovered during the 1900–1901 shipwreck salvage.',
      'Inscriptions and tomography helped decode its functions.',
      'Its eclipse dial used the 223-lunar-month Saros cycle.'
    ],
    limits: '“Computer” describes an analogue astronomical calculator, not electronics. Some mechanisms are reconstructed from incomplete evidence; creator, precise date and missing components remain debated.',
    sources: [
      { label: 'National Archaeological Museum: history and dating', url: 'https://antikythera-mechanism.namuseum.gr/en/science-historian/' },
      { label: 'Freeth, 2019: eclipse prediction research', url: 'https://www.nature.com/articles/s41599-018-0210-9' },
      { label: 'Photograph: Peulle / Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Antikythera_Mechanism_(NAMA)_2017.jpg' },
      { label: 'Image licence: CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' }
    ],
    image: 'assets/antikythera-mechanism.jpg',
    imageAlt: 'Three corroded fragments of the actual Antikythera mechanism on display in Athens.',
    imageCredit: 'Peulle, Antikythera Mechanism (NAMA) 2017, via Wikimedia Commons. CC BY-SA 4.0. Wikimedia 1280 px thumbnail.'
  },
  {
    id: 'heracleion',
    title: 'Thonis-Heracleion: the sunken port',
    kicker: 'A city underwater',
    hook: 'Two ancient names. One city. Found beneath the sea.',
    year: 'Rediscovered in 2000',
    category: 'Ancient world',
    status: 'Archaeological find',
    summary: 'Ancient texts and inscriptions preserved two names while their city lay submerged. Franck Goddio and the European Institute for Underwater Archaeology located the remains in 2000 in Aboukir Bay, roughly 6.5 kilometres off Egypt’s present coast. Temples, harbour basins, statues and inscribed monuments emerged from the surveys and excavations. The finds joined the names: Thonis for the Egyptians, Heracleion for the Greeks. Oxford research catalogued hundreds of recovered statuettes and amulets. This is a documented lost city whose physical remains make the rediscovery tangible, with much archaeology still to explore.',
    facts: [
      'Located in Aboukir Bay by the IEASM team in 2000.',
      'Archaeology joined the Egyptian and Greek names to one city.',
      'Temple remains, harbour basins and monuments survive underwater.'
    ],
    limits: 'Thonis-Heracleion is a historically attested Egyptian port. Its rediscovery does not identify Plato’s Atlantis or establish that every lost-city legend is historical.',
    sources: [
      { label: 'Excavation team: Thonis-Heracleion project', url: 'https://www.franckgoddio.org/projects/sunken-civilizations/heracleion' },
      { label: 'Oxford: catalogue research on the recovered statuettes', url: 'https://ora.ox.ac.uk/objects/uuid:db17df52-6f5b-41e5-a650-f6ad268b2c60' }
    ]
  },
  {
    id: 'atlantis',
    title: 'Atlantis: read the original account',
    kicker: 'The unresolved island',
    hook: 'A vanished island empire. One ancient author. An enduring search.',
    year: 'Plato’s dialogues · 4th century BCE',
    category: 'Ancient world',
    status: 'Literary account',
    summary: 'The foundational account of Atlantis appears in Plato’s Timaeus and Critias. A speaker describes a powerful island beyond the Pillars of Heracles, a conflict with ancient Athens and destruction by earthquakes and floods. The tale has inspired centuries of proposed locations and interpretations. Reading the original makes a fascinating investigation: which details are in Plato, which were added later, and what would count as archaeological confirmation? The Penn Museum’s scholarly discussion interprets Atlantis as a philosophical fiction. No generally accepted archaeological identification establishes the island empire as Plato describes it.',
    facts: [
      'The foundational literary sources are Timaeus and Critias.',
      'Timaeus describes destruction by earthquakes and floods.',
      'Proposed locations must be distinguished from verified excavations.'
    ],
    limits: 'Plato’s narrative is evidence that the story was told, not by itself evidence of the island’s existence. Real submerged settlements cannot automatically validate Atlantis.',
    sources: [
      { label: 'Original source: Plato, Timaeus 25', url: 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus%3Atext%3A1999.01.0180%3Atext%3DTim.%3Apage%3D25' },
      { label: 'Penn Museum: Atlantis Lost and Found', url: 'https://www.penn.museum/sites/expedition/atlantis-lost-and-found/' }
    ]
  }
];
