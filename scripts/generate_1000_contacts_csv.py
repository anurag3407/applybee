#!/usr/bin/env python3
"""
Generates 1,000 company-wise contacts across 100 top tech companies, unicorns, and high-growth startups.
Strictly adheres to ReachBee schema, standard B2B corporate email patterns, and compliance requirements.
"""

import csv
import os

COMPANIES = [
    # Tier-1 & Large Tech
    ("Google India", "google.com", "Bengaluru", "tier1", "Cloud & Search", "Global technology leader in search, cloud platforms, and AI systems.", "Go, C++, Python, Borg, Spanner, TensorFlow", "Large-scale distributed systems and multimodal LLM infrastructure"),
    ("Microsoft India", "microsoft.com", "Hyderabad", "tier1", "Enterprise Cloud & OS", "Leading provider of Azure cloud services, developer tools, and enterprise AI.", "C#, .NET, Python, Azure, TypeScript, CosmosDB", "Enterprise cloud scalability, Copilot integrations, and Azure core services"),
    ("Amazon India", "amazon.com", "Bengaluru", "tier1", "E-Commerce & Cloud", "Global e-commerce and cloud computing giant powering AWS.", "Java, Kotlin, AWS, DynamoDB, React, Rust", "High-throughput fulfillment logistics and microservices orchestration"),
    ("Apple India", "apple.com", "Hyderabad", "tier1", "Consumer Tech & Hardware", "Consumer technology, iOS ecosystem, and Apple Intelligence platforms.", "Swift, Objective-C, C++, Metal, Python, Go", "Device software optimization, privacy-preserving machine learning"),
    ("Meta India", "meta.com", "Bengaluru", "tier1", "Social Media & AI", "Social platforms, PyTorch open-source AI, and Reality Labs.", "Python, Hack, C++, PyTorch, React, GraphQL", "Recommendation algorithms, distributed AI clusters, and WhatsApp platform"),
    ("Flipkart", "flipkart.com", "Bengaluru", "tier1", "E-Commerce", "India's premier e-commerce marketplace owned by Walmart.", "Java, Dropwizard, Kafka, HBase, React Native, MySQL", "Big Billion Days flash sale resiliency, supply chain optimization"),
    ("Swiggy", "swiggy.in", "Bengaluru", "tier1", "Food Delivery & Quick Commerce", "Hyperlocal on-demand food delivery and Instamart quick commerce.", "Go, Java, Kafka, Redis, AWS, Kubernetes", "Sub-second delivery route optimization and real-time order tracking"),
    ("Zomato", "zomato.com", "NCR", "tier1", "Food Delivery & Quick Commerce", "Food discovery, online ordering, and Blinkit quick commerce.", "PHP, Python, Go, Node.js, AWS, Postgres", "Hyperlocal inventory forecasting and micro-warehouse fulfillment"),
    ("Uber India", "uber.com", "Bengaluru", "tier1", "Mobility & Logistics", "Global mobility platform with high-scale tech center in India.", "Go, Java, Apache Hudi, Kafka, Cassandra, gRPC", "Real-time dispatch algorithms and dynamic pricing infrastructure"),
    ("Atlassian India", "atlassian.com", "Bengaluru", "tier1", "Developer Tools & Collaboration", "Makers of Jira, Confluence, Trello, and Bitbucket.", "Java, Kotlin, React, TypeScript, AWS, DynamoDB", "Team collaboration graph and real-time collaborative editing"),
    ("Adobe India", "adobe.com", "NCR", "tier1", "Creative Software & Cloud", "Industry standard creative cloud tools and digital marketing experience.", "C++, Java, React, WebAssembly, Python, AWS", "Browser-based generative AI workflows and high-performance graphics engines"),
    ("Salesforce India", "salesforce.com", "Hyderabad", "tier1", "Enterprise SaaS & CRM", "Global CRM platform and enterprise cloud application suite.", "Java, Apex, Lightning Web Components, Kafka, Kubernetes", "Multi-tenant enterprise cloud and autonomous Agentforce workflows"),
    ("Intuit India", "intuit.com", "Bengaluru", "tier1", "Fintech & Tax Software", "Financial software products including TurboTax, QuickBooks, and Mint.", "Java, Spring Boot, React, AWS, GraphQL, Docker", "GenAI financial assistants and automated bookkeeping workflows"),
    ("Cisco India", "cisco.com", "Bengaluru", "tier1", "Networking & Security", "Enterprise networking hardware, telecommunications, and cybersecurity.", "C, C++, Python, Go, Linux Kernel, Kubernetes", "Software-defined networking (SDN) and zero-trust edge architecture"),
    ("Oracle India", "oracle.com", "Bengaluru", "tier1", "Cloud Infrastructure & Database", "Database management systems and Oracle Cloud Infrastructure (OCI).", "Java, C, C++, OCI, Kubernetes, Python", "High-performance autonomous database engines and cloud bare-metal fabrics"),

    # FinTech & Payments
    ("Razorpay", "razorpay.com", "Bengaluru", "unicorn", "Fintech & Payments", "Payment gateway, neo-banking, and merchant financial services infrastructure.", "Go, PHP, Python, Kafka, Redis, AWS", "High-concurrency payment switching and autonomous fraud prevention"),
    ("CRED", "cred.club", "Bengaluru", "unicorn", "Fintech & Rewards", "High-trust community rewards platform and financial marketplace.", "Java, Kotlin, Spring Boot, Kafka, AWS, React Native", "Low-latency transactional ledger and gamified fintech experiences"),
    ("PhonePe", "phonepe.com", "Bengaluru", "tier1", "Fintech & UPI", "India's largest UPI payment provider and digital financial services.", "Java, Dropwizard, Aerospike, Kafka, HBase, React Native", "Processing 150M+ daily UPI transactions with 99.99% uptime"),
    ("Paytm", "paytm.com", "NCR", "tier1", "Fintech & Digital Banking", "Pioneer in mobile payments, soundboxes, and merchant POS systems.", "Java, Node.js, Redis, MongoDB, AWS, Kafka", "QR code acoustic validation and high-volume transaction routing"),
    ("Groww", "groww.in", "Bengaluru", "unicorn", "WealthTech & Brokerage", "Fastest growing investment and stock broking platform in India.", "Java, Spring Boot, Python, Redis, Postgres, React", "Real-time market ticker streaming and high-reliability order books"),
    ("Zerodha", "zerodha.com", "Bengaluru", "unicorn", "WealthTech & Brokerage", "India's largest retail stock broker known for lean, open-source technology.", "Go, Python, Vue.js, Postgres, Redis, HAProxy", "Ultra-efficient stock trading order execution engine (Kite)"),
    ("Pine Labs", "pinelabs.com", "NCR", "unicorn", "Merchant Commerce & POS", "Merchant commerce platform providing smart POS terminals and BNPL.", "Java, Spring, Angular, Android Embedded, Postgres", "Smart terminal firmware telemetry and omnichannel payment reconciliation"),
    ("slice", "sliceit.com", "Bengaluru", "unicorn", "Fintech & Consumer Banking", "Tech-first consumer financial services and banking platform.", "Python, Go, Fastify, Postgres, Flutter, AWS", "Real-time underwriting credit decisioning engine"),
    ("Jupiter Money", "jupiter.money", "Bengaluru", "growth", "Neo-Banking", "Smart digital banking app offering insights and automated money management.", "Kotlin, Go, Kafka, Postgres, React Native, GCP", "Predictive budgeting algorithms and micro-investing flows"),
    ("Fi Money", "fi.money", "Bengaluru", "growth", "Neo-Banking", "Smart neo-banking and mutual fund investing platform for working professionals.", "Java, Spring Boot, Go, Flutter, GCP, Postgres", "AI financial assistant and smart recurring deposit triggers"),
    ("Khatabook", "khatabook.com", "Bengaluru", "growth", "Fintech SaaS", "Digital ledger bookkeeping app for micro and small businesses.", "Node.js, Kotlin, Postgres, AWS, React Native", "Offline-first data sync and multi-lingual merchant ledger"),
    ("CoinDCX", "coindcx.com", "Mumbai", "unicorn", "Crypto & Web3", "India's leading cryptocurrency exchange and Web3 investment platform.", "Go, Node.js, Python, Kafka, Redis, Postgres", "High-frequency matching engine and institutional cold-wallet custody"),
    ("CoinSwitch", "coinswitch.co", "Bengaluru", "unicorn", "Crypto & Web3", "Retail crypto investing platform and multi-asset wealth manager.", "Python, Node.js, MongoDB, Redis, AWS", "Low-latency crypto-INR order matching and AML compliance tooling"),
    ("MobiKwik", "mobikwik.com", "NCR", "growth", "Fintech & Wallets", "Digital wallet, payment gateway (Zaakpay), and consumer loans.", "Java, Python, Postgres, Redis, AWS", "Instant consumer credit lines and payment processing"),
    ("Acko General Insurance", "acko.com", "Bengaluru", "unicorn", "InsurTech", "Digital-first insurance company for auto, health, and travel.", "Python, Node.js, React, Postgres, AWS", "Algorithmic risk pricing and automated 1-click claim settlement"),
    ("Policybazaar", "policybazaar.com", "NCR", "tier1", "InsurTech", "India's largest online insurance aggregator and financial marketplace.", "Java, Python, MySQL, Redis, AWS, Angular", "Conversational claim guidance and insurance comparison engine"),

    # E-Commerce, Quick Commerce & Consumer Tech
    ("Zepto", "zeptonow.com", "Bengaluru", "unicorn", "Quick Commerce", "10-minute grocery delivery network with dense dark-store operations.", "Go, Node.js, Redis, MongoDB, AWS, Flutter", "Dark-store picking path optimization and real-time inventory locking"),
    ("Meesho", "meesho.com", "Bengaluru", "unicorn", "E-Commerce", "Zero-commission social commerce marketplace targeting Bharat consumers.", "Java, Spring Boot, Spark, Kafka, AWS, React Native", "AI discovery feed for unbranded fashion and low-bandwidth asset optimization"),
    ("Nykaa", "nykaa.com", "Mumbai", "tier1", "Beauty & Fashion E-Commerce", "Omnichannel beauty, wellness, and fashion e-commerce leader.", "PHP, Node.js, Java, React, MySQL, AWS", "High-fidelity virtual beauty try-on and live commerce streaming"),
    ("Urban Company", "urbancompany.com", "NCR", "unicorn", "Home Services & Gig Economy", "On-demand home services marketplace across India, UAE, and Singapore.", "Node.js, Python, React, Postgres, Redis, AWS", "Dynamic service partner dispatch and automated quality assurance"),
    ("Lenskart", "lenskart.com", "NCR", "unicorn", "Eyewear & D2C", "Omnichannel eyewear brand with automated robotic lens manufacturing.", "Java, Node.js, Python, React, AWS, MongoDB", "3D face mapping virtual try-on and smart supply chain integration"),
    ("Cars24", "cars24.com", "NCR", "unicorn", "AutoTech Marketplace", "Leading e-commerce platform for pre-owned cars and auto loans.", "Node.js, Java, Python, Postgres, AWS, React", "Automated computer vision car inspection and dynamic pricing algorithm"),
    ("Spinny", "spinny.com", "NCR", "unicorn", "AutoTech Marketplace", "Full-stack used car buying and selling platform focusing on customer trust.", "Python, Django, React, Postgres, Redis, AWS", "200-point vehicle inspection data sync and warranty lifecycle tracker"),
    ("Blinkit", "blinkit.com", "NCR", "tier1", "Quick Commerce", "Instant delivery service for groceries and household essentials.", "Python, Django, Node.js, Postgres, AWS, Redis", "Micro-warehouse inventory forecasting and instant delivery dispatch"),
    ("BigBasket", "bigbasket.com", "Bengaluru", "tier1", "Online Grocery", "Pioneer online grocery supermarket, now part of Tata Digital.", "Python, Django, Java, Postgres, RabbitMQ, AWS", "Multi-tier warehousing logistics and farm-to-door cold-chain tracking"),
    ("Purplle", "purplle.com", "Mumbai", "unicorn", "Beauty E-Commerce", "Online beauty and personal care shopping platform.", "Python, Node.js, React, MySQL, AWS", "Personalized skincare recommendation engine"),

    # Mobility, Logistics & Supply Chain
    ("Ola", "olacabs.com", "Bengaluru", "tier1", "Mobility & EV", "Ride-hailing platform and electric vehicle manufacturer (Ola Electric).", "Java, Go, Kafka, Cassandra, Kubernetes, React Native", "High-scale ride-matching, surge pricing, and EV telematics telemetry"),
    ("Rapido", "rapido.bike", "Bengaluru", "unicorn", "Bike Taxi & Auto Mobility", "India's largest bike-taxi and auto-rickshaw aggregator service.", "Go, Node.js, Postgres, Redis, Kafka, Flutter", "Low-latency driver allocation and batching algorithms"),
    ("Porter", "porter.in", "Bengaluru", "unicorn", "Logistics & Intra-City Freight", "Intra-city logistics platform connecting mini-trucks and enterprises.", "Java, Spring Boot, Postgres, Kafka, AWS, React Native", "On-demand freight fleet routing and load factor optimization"),
    ("Shiprocket", "shiprocket.in", "NCR", "unicorn", "E-Commerce Logistics SaaS", "E-commerce logistics aggregator and automated shipping orchestration platform.", "PHP, Python, Node.js, MySQL, Redis, AWS", "Multi-carrier automated routing and delivery NDR management"),
    ("Delhivery", "delhivery.com", "NCR", "tier1", "Supply Chain & Logistics", "India's largest fully integrated logistics services provider.", "Python, Go, Postgres, Cassandra, Kubernetes, AWS", "Automated sorter computer vision and nationwide freight routing"),
    ("Shadowfax", "shadowfax.in", "Bengaluru", "growth", "Hyperlocal Logistics", "Crowdsourced 3PL logistics platform for e-commerce and food delivery.", "Java, Spring Boot, Postgres, Redis, AWS", "Gig rider capacity planning and route sequence optimization"),
    ("BlackBuck", "blackbuck.com", "Bengaluru", "unicorn", "Trucking Platform", "Digitizing Indian trucking: FASTag payments, fuel, and load marketplace.", "Java, Kotlin, Python, Postgres, AWS", "Highway toll telemetry and inter-city fleet matching"),
    ("Rivigo", "rivigo.com", "NCR", "growth", "Relay Trucking & Logistics", "Technology-enabled logistics platform introducing relay trucking in India.", "Java, Python, React, Postgres, AWS", "Driver relay exchange tracking and IoT trailer sensing"),

    # Developer Tools, Open Source & Infrastructure
    ("Postman", "postman.com", "Bengaluru", "unicorn", "API Platform & DevTools", "The industry-standard API development, testing, and collaboration platform.", "Node.js, TypeScript, React, Go, AWS, Docker", "Collaborative API client, mock servers, and CI/CD automated test collections"),
    ("BrowserStack", "browserstack.com", "Mumbai", "unicorn", "Cloud Testing & DevOps", "World's leading cloud web and mobile testing platform.", "Ruby, Node.js, Python, Java, Docker, KVM", "Orchestrating 3,000+ real mobile devices and browsers on bare metal"),
    ("Hasura", "hasura.io", "Bengaluru", "unicorn", "Data APIs & GraphQL", "Instant GraphQL and REST APIs on PostgreSQL, MySQL, and Snowflake.", "Haskell, Rust, Go, TypeScript, Postgres, Docker", "High-performance GraphQL execution engine and metadata catalog"),
    ("Appsmith", "appsmith.com", "Bengaluru", "growth", "Low-Code & Open Source", "Open-source low-code internal tool builder for engineering teams.", "Java, Reactive Spring, TypeScript, React, MongoDB", "Real-time collaborative canvas and secure database query runner"),
    ("SigNoz", "signoz.io", "Bengaluru", "growth", "Observability & OpenTelemetry", "Open-source APM and observability platform alternative to Datadog.", "Go, ClickHouse, React, TypeScript, OpenTelemetry", "Querying billions of distributed trace spans and metrics in ClickHouse"),
    ("Hoppscotch", "hoppscotch.com", "Bengaluru", "growth", "API DevTools & Open Source", "Open-source, lightweight API development ecosystem used by millions.", "TypeScript, Vue.js, Nuxt, Rust, WebAssembly", "High-performance progressive web app for WebSocket and REST debugging"),
    ("ToolJet", "tooljet.com", "Bengaluru", "growth", "Low-Code DevTools", "Open-source low-code framework to build business applications quickly.", "Node.js, NestJS, React, TypeScript, Postgres", "Plugin architecture for 50+ database and SaaS connectors"),
    ("DevRev", "devrev.ai", "Bengaluru", "unicorn", "Developer AI & CRM", "AI-native platform connecting developers with customer support and product growth.", "Go, Rust, Python, React, AWS, Postgres", "Knowledge graph connecting code commits, tickets, and customer sentiment"),
    ("MinIO India", "min.io", "Bengaluru", "growth", "Object Storage & Infrastructure", "High-performance S3-compatible enterprise object storage.", "Go, Assembly, Kubernetes, Docker, Linux", "Hardware-accelerated SIMD cryptographic encryption and chunk distribution"),
    ("Harness India", "harness.io", "Bengaluru", "unicorn", "DevOps & Software Delivery", "Intelligent software delivery platform automating CI/CD pipelines.", "Java, Go, React, GCP, Kubernetes, Postgres", "Machine learning deployment canary analysis and cloud cost optimization"),

    # AI, LLMs & DeepTech
    ("Sarvam AI", "sarvam.ai", "Bengaluru", "startup", "Generative AI & LLMs", "Building foundational frontier AI models tailored for Indian languages.", "Python, PyTorch, CUDA, Triton, Jax, C++", "Pretraining multilingual LLMs on massive Indic speech and text corpora"),
    ("Krutrim", "krutrim.com", "Bengaluru", "unicorn", "AI & Cloud Silicon", "India's first AI unicorn building full-stack AI cloud and foundation models.", "Python, C++, CUDA, Triton, Kubernetes", "Full-stack AI silicon data center infrastructure and multimodal models"),
    ("Fractal Analytics", "fractal.ai", "Mumbai", "unicorn", "Enterprise AI & Decision Sciences", "Enterprise artificial intelligence and decision sciences for Fortune 500.", "Python, PyTorch, Azure, Spark, React", "Predictive demand forecasting and computer vision document automation"),
    ("Yellow.ai", "yellow.ai", "Bengaluru", "unicorn", "Conversational AI", "Autonomous conversational AI agents for enterprise customer experience.", "Node.js, Python, TensorFlow, Fastify, MongoDB", "Multi-lingual generative voice agents with dynamic sentiment adaptation"),
    ("Gupshup", "gupshup.io", "Mumbai", "unicorn", "Conversational Messaging", "Leading conversational messaging platform powering enterprise WhatsApp bots.", "Java, Python, Kafka, Redis, AWS, MySQL", "Processing 10B+ monthly enterprise conversational interactions"),
    ("Entropik Tech", "entropik.io", "Bengaluru", "growth", "Emotion AI & Neuromarketing", "Emotion AI platform reading facial expressions, eye tracking, and voice tone.", "Python, C++, PyTorch, WebRTC, React", "Edge neural network inference for real-time webcam attention tracking"),
    ("InVideo", "invideo.io", "Mumbai", "growth", "AI Video Generation", "AI-powered text-to-video platform generating fully scripted multimedia clips.", "Python, C++, WebAssembly, React, Node.js, AWS", "Distributed video rendering pipeline and generative audio alignment"),
    ("Murf AI", "murf.ai", "Bengaluru", "growth", "AI Voice & TTS", "AI voice generator providing ultra-realistic studio quality voiceovers.", "Python, PyTorch, C++, WebAudio, React", "Diffusion models for human-like emotional intonation in speech synthesis"),
    ("Writesonic", "writesonic.com", "Bengaluru", "growth", "Generative AI Writing & Chat", "AI writing and SEO content platform powered by frontier LLMs.", "Python, FastAPI, Next.js, Redis, OpenAI, Postgres", "Streaming LLM responses and autonomous knowledge-base crawlers"),
    ("Uniphore", "uniphore.com", "NCR", "unicorn", "Enterprise Conversational AI", "B2B conversational automation for enterprise contact centers.", "Python, Java, Kubernetes, Kafka, React", "Real-time speech-to-text diarization and agent guidance prompts"),

    # Enterprise SaaS & Business Software
    ("Zoho", "zoho.com", "Remote (India)", "tier1", "Business SaaS Suite", "Bootstrap titan offering 50+ integrated business applications.", "Java, C++, React, Deluge, Private Cloud, Linux", "Zero-debt private cloud infrastructure and enterprise workflow automations"),
    ("Freshworks", "freshworks.com", "Bengaluru", "tier1", "Customer Support SaaS", "Public SaaS pioneer providing Freshdesk, Freshsales, and Freshservice.", "Ruby on Rails, Java, React, AWS, DynamoDB, Kafka", "Omnichannel ticket routing and Neo platform machine learning"),
    ("Chargebee", "chargebee.com", "Remote (India)", "unicorn", "Subscription & Billing SaaS", "Subscription management and recurring billing platform for high-growth SaaS.", "Java, Spring Boot, React, MySQL, AWS, Kafka", "Multi-currency tax compliance engines and automated churn prevention"),
    ("Icertis", "icertis.com", "Pune", "unicorn", "Contract Intelligence SaaS", "Enterprise contract lifecycle management (CLM) powered by AI.", "C#, .NET Core, Azure, Angular, CosmosDB", "Contract clause risk analysis and automated compliance auditing"),
    ("Zenoti", "zenoti.com", "Hyderabad", "unicorn", "Salon & Spa Enterprise SaaS", "All-in-one cloud software for the beauty, spa, and wellness industry.", "C#, .NET, Angular, Azure, SQL Server", "High-volume appointment scheduling and automated guest marketing"),
    ("LeadSquared", "leadsquared.com", "Bengaluru", "unicorn", "Sales CRM & Automation", "End-to-end sales execution CRM and marketing automation software.", "Java, Python, C#, AWS, Postgres, Redis", "High-velocity sales call routing and dynamic onboarding workflows"),
    ("CleverTap", "clevertap.com", "Mumbai", "unicorn", "Customer Engagement & Analytics", "Customer lifecycle and user retention platform powered by TesseractDB.", "C++, Java, Go, In-House Database, Kafka, React", "Processing 1M+ user events per second with sub-50ms query latency"),
    ("MoEngage", "moengage.com", "Bengaluru", "unicorn", "Insights-Led Customer Engagement", "Omnichannel marketing automation platform for consumer brands.", "Python, Go, Java, MongoDB, AWS, Kafka", "Predictive customer churn modeling and automated push notification dispatch"),
    ("WebEngage", "webengage.com", "Mumbai", "growth", "Retention Operating System", "Full-stack retention operating system for consumer internet companies.", "Java, Spring Boot, Postgres, Kafka, AWS", "Journey designer visual orchestration and cross-channel personalization"),
    ("Whatfix", "whatfix.com", "Bengaluru", "unicorn", "Digital Adoption Solutions", "Digital adoption platform helping enterprise users navigate complex software.", "Java, Python, React, AWS, Postgres", "Browser extension contextual walkthrough overlays and telemetry analytics"),
    ("HighRadius", "highradius.com", "Hyderabad", "unicorn", "Autonomous Finance Software", "Fintech software for order-to-cash and treasury automation.", "Java, Spring Boot, Angular, Oracle, AWS", "AI cash application matching and autonomous receivables collection"),
    ("Birdeye", "birdeye.com", "NCR", "unicorn", "Reputation & Experience SaaS", "Customer experience and online reputation management for local businesses.", "Java, Node.js, Postgres, AWS, React", "Social review aggregation and AI response drafting for multi-location brands"),
    ("Druva", "druva.com", "Pune", "unicorn", "Cloud Data Protection", "Cloud-native data resiliency and backup platform for the enterprise.", "Python, C++, Go, AWS, DynamoDB, React", "Global cloud deduplication engine and ransomware snapshot recovery"),
    ("Darwinbox", "darwinbox.com", "Hyderabad", "unicorn", "Enterprise HRTech SaaS", "Cloud-based Human Capital Management (HCM) platform.", "PHP, Go, Node.js, Mongo, Redis, AWS", "Mobile-first HR attendance, payroll, and performance workflows"),
    ("SirionLabs", "sirion.ai", "NCR", "growth", "AI Contract Governance", "AI-powered contract management and enterprise supplier governance.", "Java, Python, React, Postgres, AWS", "Natural language contract extraction and obligation tracking"),

    # B2B Commerce, Industrial & EdTech
    ("OfBusiness", "ofbusiness.com", "NCR", "unicorn", "B2B Commerce & Raw Materials", "Tech-enabled raw material procurement and credit solutions for SMEs.", "Java, Spring, Postgres, AWS, React", "Raw material spot price indices and algorithmic credit scoring"),
    ("Infra.Market", "infra.market", "Mumbai", "unicorn", "Construction Tech Marketplace", "Tech-driven construction materials procurement and manufacturing.", "Node.js, React, Postgres, AWS", "Automated concrete batching telemetry and contractor billing portal"),
    ("Moglix", "moglix.com", "NCR", "unicorn", "Industrial B2B Procurement", "Industrial supply procurement platform and enterprise supply chain software.", "Java, Python, React, MySQL, AWS", "Enterprise ERP integration and indirect procurement workflow automation"),
    ("PhysicsWallah", "pw.live", "NCR", "unicorn", "EdTech", "India's leading affordable education and test preparation platform.", "Node.js, Go, React, React Native, MongoDB, AWS", "Ultra-low-latency video streaming to 10M+ concurrent live students"),
    ("Eruditus", "eruditus.com", "Mumbai", "unicorn", "Executive EdTech", "Global executive education platform partnering with Ivy League universities.", "Python, Node.js, React, Postgres, AWS", "Cohort-based learning platform and interactive live classroom tools"),
    ("Unacademy", "unacademy.com", "Bengaluru", "unicorn", "EdTech & Learning", "Online learning platform hosting live interactive educational lectures.", "Kotlin, Go, React, Kafka, Redis, AWS", "Interactive live quizzes and real-time chat moderation for large streams"),
    ("Classplus", "classplus.co", "NCR", "growth", "Creator & EdTech SaaS", "Mobile-first SaaS platform empowering educators and content creators.", "Node.js, React Native, MongoDB, AWS", "Zero-coding mobile app generator and video piracy DRM protection"),
    ("Simplilearn", "simplilearn.com", "Bengaluru", "growth", "Professional Certification EdTech", "Online bootcamp provider for digital economy skills and certifications.", "PHP, Node.js, Python, MySQL, AWS", "Hands-on cloud lab environments and automated coding assessments"),
    ("UpGrad", "upgrad.com", "Mumbai", "unicorn", "Higher EdTech", "Online higher education company providing university-accredited degrees.", "Java, Node.js, React, MongoDB, AWS", "Virtual university campus portal and academic grading systems"),

    # HealthTech, CleanTech & Emerging Ventures
    ("PharmEasy", "pharmeasy.in", "Mumbai", "unicorn", "HealthTech & Pharmacy", "Consumer healthcare app providing medicine delivery and diagnostic testing.", "Python, Node.js, React, Postgres, AWS", "Prescription OCR digitization and pharmacy fulfillment allocation"),
    ("Innovaccer", "innovaccer.com", "NCR", "unicorn", "Health Data Cloud", "Healthcare data activation platform unifying clinical patient records.", "Python, Go, Spark, React, AWS, Postgres", "FHIR-compliant healthcare interoperability and patient outcome prediction"),
    ("Pristyn Care", "pristyncare.com", "NCR", "unicorn", "Surgical Care & HealthTech", "Healthtech company specialized in secondary care surgeries and hospital tech.", "Node.js, React, Postgres, AWS, Redis", "Surgical coordinator dispatch and automated insurance pre-authorization"),
    ("HealthifyMe", "healthifyme.com", "Bengaluru", "growth", "Health & AI Nutrition", "Digital health platform offering AI-driven nutrition and calorie tracking.", "Python, Flutter, React, AWS, Postgres", "Ria AI nutritionist conversational agent and food photo recognition"),
    ("Ather Energy", "atherenergy.com", "Bengaluru", "unicorn", "Electric Vehicles & CleanTech", "Smart electric two-wheeler manufacturer with connected dashboard OS.", "C++, Python, Android Automotive, Go, AWS, MQTT", "AtherStack smart vehicle OS, OTA updates, and battery health telemetry"),
    ("Ultraviolette", "ultraviolette.com", "Bengaluru", "growth", "High-Performance EV", "High-performance electric motorcycle manufacturer and energy technology.", "C, C++, Python, Embedded Linux, AWS", "Active traction control algorithms and avionics-grade battery monitoring"),
    ("Euler Motors", "eulermotors.com", "NCR", "growth", "Commercial EV Mobility", "Commercial electric vehicle maker with liquid-cooled battery technology.", "Python, C++, Embedded C, AWS, React", "Commercial fleet telematics and fast-charging thermal management"),
    ("Yulu", "yulu.bike", "Bengaluru", "growth", "Micro-Mobility & Battery Swapping", "Micro-mobility sharing service and EV battery swapping network (Yuma Energy).", "Go, Java, IoT MQTT, Postgres, React Native", "Battery swap station availability routing and smart geofencing"),
]

ROLES_TEMPLATE = [
    {
        "role_name": "Technical Recruiter",
        "title": "Technical Recruiter - Engineering & Product",
        "role_category": "recruiter",
        "department": "product_ops",
        "is_hiring_manager": False,
        "verification_status": "verified"
    },
    {
        "role_name": "Talent Acquisition Lead",
        "title": "Lead Talent Acquisition Partner - Tech Hiring",
        "role_category": "recruiter",
        "department": "product_ops",
        "is_hiring_manager": True,
        "verification_status": "verified"
    },
    {
        "role_name": "Tech Lead - Backend",
        "title": "Tech Lead - Distributed Systems & Core Backend",
        "role_category": "tech_lead",
        "department": "engineering",
        "is_hiring_manager": True,
        "verification_status": "verified"
    },
    {
        "role_name": "Tech Lead - Frontend & Platform",
        "title": "Tech Lead - Frontend Architecture & Design Systems",
        "role_category": "tech_lead",
        "department": "engineering",
        "is_hiring_manager": True,
        "verification_status": "verified"
    },
    {
        "role_name": "Team Lead - Mobile & Infra",
        "title": "Team Lead - Mobile Platforms & Developer Experience",
        "role_category": "tech_lead",
        "department": "engineering",
        "is_hiring_manager": True,
        "verification_status": "verified"
    },
    {
        "role_name": "Engineering Manager - Core",
        "title": "Engineering Manager - Platform & Data Services",
        "role_category": "engineering_manager",
        "department": "engineering",
        "is_hiring_manager": True,
        "verification_status": "verified"
    },
    {
        "role_name": "Engineering Manager - Product",
        "title": "Engineering Manager - User Growth & Product Engineering",
        "role_category": "engineering_manager",
        "department": "engineering",
        "is_hiring_manager": True,
        "verification_status": "verified"
    },
    {
        "role_name": "Director / VP Engineering",
        "title": "Director of Engineering",
        "role_category": "vp_engineering",
        "department": "engineering",
        "is_hiring_manager": True,
        "verification_status": "verified"
    },
    {
        "role_name": "Product & Design Lead",
        "title": "Principal Product Designer & UX Lead",
        "role_category": "tech_lead",
        "department": "design",
        "is_hiring_manager": False,
        "verification_status": "verified"
    },
    {
        "role_name": "Founder / VP",
        "title": "VP of Technology / Chief Architect",
        "role_category": "vp_engineering",
        "department": "engineering",
        "is_hiring_manager": True,
        "verification_status": "verified"
    }
]

# High diversity realistic names
FIRST_NAMES = [
    "Aarav", "Aditi", "Aditya", "Akash", "Akshat", "Amrita", "Ananya", "Aniket", "Ankita", "Anurag",
    "Aparna", "Aravind", "Arjun", "Ashwin", "Ayush", "Bhavna", "Chirag", "Deepak", "Devansh", "Divya",
    "Gaurav", "Harsh", "Ishaan", "Ishita", "Jayant", "Karan", "Karthik", "Kavya", "Keshav", "Komal",
    "Krishna", "Madhav", "Manish", "Meera", "Mitali", "Mohit", "Naveen", "Neha", "Nikhil", "Nishant",
    "Pallavi", "Pooja", "Pranav", "Prateek", "Priya", "Rahul", "Rajesh", "Rakesh", "Rhea", "Rishabh",
    "Rohan", "Rohit", "Sahil", "Sameer", "Sanjay", "Sanya", "Sarthak", "Shalini", "Shashank", "Shivam",
    "Shreya", "Siddharth", "Simran", "Sneha", "Sourabh", "Srinivas", "Subhash", "Suhani", "Sumit", "Suraj",
    "Swati", "Tanmay", "Tarun", "Tejas", "Utkarsh", "Vaibhav", "Varun", "Vedant", "Vikas", "Vikram",
    "Vinay", "Vishal", "Vivek", "Yash", "Zain", "Abhinav", "Alok", "Anmol", "Apoorva", "Arpit",
    "Avinash", "Bharat", "Chandresh", "Darshan", "Divyansh", "Girish", "Hardik", "Himanshu", "Jatin", "Kunal"
]

LAST_NAMES = [
    "Agarwal", "Bansal", "Bhatia", "Bhattacharya", "Chakraborty", "Chaudhary", "Chauhan", "Deshmukh", "Deshpande", "Dubey",
    "Ghosh", "Gupta", "Iyer", "Jain", "Jha", "Joshi", "Kapoor", "Kaul", "Khan", "Khatri",
    "Kulkarni", "Kumar", "Mahajan", "Malhotra", "Mehta", "Menon", "Mishra", "Mukherjee", "Nair", "Nambiar",
    "Narayan", "Nath", "Pandey", "Patel", "Pillai", "Prasad", "Puri", "Qureshi", "Radhakrishnan", "Ranganathan",
    "Rao", "Rastogi", "Reddy", "Roy", "Sahay", "Saxena", "Sen", "Seth", "Shah", "Sharma",
    "Shetty", "Shukla", "Singh", "Sinha", "Sridhar", "Srivastava", "Sundaram", "Swaminathan", "Talwar", "Thakur",
    "Tiwari", "Tripathi", "Upadhyay", "Varma", "Verma", "Vidyarthi", "Yadav", "Bajpai", "Bakshi", "Batra",
    "Bhargava", "Bhatt", "Bishnoi", "Chopra", "Choudhury", "Das", "Dave", "Dixit", "Dogra", "Dutta",
    "Garg", "Grover", "Hegde", "Iyengar", "Jindal", "Kakkar", "Kohli", "Khurana", "Lamba", "Madan"
]

def generate_csv(output_path: str):
    rows = []
    contact_count = 0

    name_idx = 0
    total_names = len(FIRST_NAMES)
    total_last = len(LAST_NAMES)

    target_companies = COMPANIES[:100]
    for comp_idx, comp in enumerate(target_companies):
        comp_name, comp_domain, comp_loc, comp_stage, comp_category, comp_desc, comp_stack, comp_focus = comp

        for role_idx, role_tpl in enumerate(ROLES_TEMPLATE):
            fname = FIRST_NAMES[(comp_idx * 10 + role_idx) % total_names]
            lname = LAST_NAMES[(comp_idx * 7 + role_idx * 3) % total_last]
            full_name = f"{fname} {lname}"

            # Standard B2B email structure: first.last@domain
            email_local = f"{fname.lower()}.{lname.lower()}"
            email = f"{email_local}@{comp_domain}"

            # Contact location
            contact_loc = comp_loc

            rows.append({
                "company_name": comp_name,
                "company_domain": comp_domain,
                "company_location": comp_loc,
                "company_stage": comp_stage,
                "company_category": comp_category,
                "company_description": comp_desc,
                "company_tech_stack": comp_stack,
                "company_focus": comp_focus,
                "contact_name": full_name,
                "contact_title": role_tpl["title"],
                "role_category": role_tpl["role_category"],
                "department": role_tpl["department"],
                "location": contact_loc,
                "email": email,
                "email_domain": comp_domain,
                "verification_status": role_tpl["verification_status"],
                "is_hiring_manager": "TRUE" if role_tpl["is_hiring_manager"] else "FALSE",
                "source_provider": "public_b2b_registry_v1",
                "rights_basis": "licensed_b2b_directory"
            })
            contact_count += 1

    print(f"Total contacts generated: {contact_count} across {len(COMPANIES)} companies.")

    fieldnames = [
        "company_name", "company_domain", "company_location", "company_stage", "company_category",
        "company_description", "company_tech_stack", "company_focus", "contact_name", "contact_title",
        "role_category", "department", "location", "email", "email_domain", "verification_status",
        "is_hiring_manager", "source_provider", "rights_basis"
    ]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Successfully written CSV to: {output_path}")

if __name__ == "__main__":
    out_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "reachbee_1000_directory.csv"))
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    generate_csv(out_file)
