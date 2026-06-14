const questions = [
  // --- Password Security ---
  {
    question: "Which of the following is considered a best practice for creating a secure password?",
    options: [
      "Using your birthdate combined with your last name.",
      "Using a phrase of 12+ characters containing symbols, numbers, and mixed-case letters.",
      "Using a password that can be easily memorized, like 'Password123!'.",
      "Reusing the same strong password across multiple work and personal accounts."
    ],
    correctAnswer: "Using a phrase of 12+ characters containing symbols, numbers, and mixed-case letters.",
    category: "Password Security",
    difficulty: "easy"
  },
  {
    question: "What is Multi-Factor Authentication (MFA) designed to do?",
    options: [
      "Allow multiple users to access the same system using a single password.",
      "Encrypt all locally stored text files and folders on a computer hard drive.",
      "Provide an extra layer of defense by requiring two or more credentials to log in.",
      "Automatically backup database entries to secondary storage targets."
    ],
    correctAnswer: "Provide an extra layer of defense by requiring two or more credentials to log in.",
    category: "Password Security",
    difficulty: "easy"
  },
  {
    question: "If a browser asks to save your credentials, which of the following is the most secure option?",
    options: [
      "Let the browser save it for convenience without master password locks.",
      "Use a dedicated, encrypted password manager with master access locks.",
      "Write them in a text file named 'credentials.txt' on your Desktop.",
      "Decline browser save and write passwords in a physical notebook left on the desk."
    ],
    correctAnswer: "Use a dedicated, encrypted password manager with master access locks.",
    category: "Password Security",
    difficulty: "easy"
  },
  {
    question: "Which password hashing algorithm is widely considered secure for storing database credentials?",
    options: [
      "MD5",
      "SHA-1",
      "bcrypt",
      "Rot13"
    ],
    correctAnswer: "bcrypt",
    category: "Password Security",
    difficulty: "medium"
  },
  {
    question: "What is a 'brute-force attack' in the context of password security?",
    options: [
      "Phishing users to hand over credentials via spoofed websites.",
      "Stealing an administrative database and parsing raw text structures.",
      "Using automated scripts to test millions of combinations until the correct key is found.",
      "Injecting malicious code blocks into web login fields to bypass validation."
    ],
    correctAnswer: "Using automated scripts to test millions of combinations until the correct key is found.",
    category: "Password Security",
    difficulty: "medium"
  },
  {
    question: "In password security, what does a 'salting' technique accomplish?",
    options: [
      "Adding random characters to passwords prior to hashing to protect against Rainbow Table lookups.",
      "Masking the entry screen characters with dot symbols to prevent shoulder surfing.",
      "Hashing passwords multiple times through a loop to increase decryption difficulty.",
      "Splitting passwords into halves stored on two distinct secure servers."
    ],
    correctAnswer: "Adding random characters to passwords prior to hashing to protect against Rainbow Table lookups.",
    category: "Password Security",
    difficulty: "hard"
  },

  // --- Phishing Awareness ---
  {
    question: "You receive an email from 'IT Helpdesk' asking you to verify your login credentials immediately or face account suspension. What should you do?",
    options: [
      "Click the link provided in the email and log in to verify your account.",
      "Reply directly to the email providing the requested details.",
      "Report the email using your organization's security reporting tool or verify via official channels.",
      "Forward the email to your colleagues asking if they received it too."
    ],
    correctAnswer: "Report the email using your organization's security reporting tool or verify via official channels.",
    category: "Phishing Awareness",
    difficulty: "easy"
  },
  {
    question: "What is 'Spear Phishing'?",
    options: [
      "A phishing attempt targeting random individuals in large volume.",
      "A targeted attack aimed at a specific individual or organization using personalized details.",
      "Phishing campaigns conducted over telephone calls or SMS texts.",
      "Malware that locks access to local system files demanding payment."
    ],
    correctAnswer: "A targeted attack aimed at a specific individual or organization using personalized details.",
    category: "Phishing Awareness",
    difficulty: "medium"
  },
  {
    question: "Which of the following headers should be verified first to spot a potential phishing email?",
    options: [
      "The email subject line capitalization.",
      "The sender's actual email domain address (e.g. support@paypaI-security.com).",
      "The date and time the email was dispatched.",
      "The formatting layout of the corporate logo in the footer."
    ],
    correctAnswer: "The sender's actual email domain address (e.g. support@paypaI-security.com).",
    category: "Phishing Awareness",
    difficulty: "easy"
  },
  {
    question: "What does 'Whaling' refer to in social engineering?",
    options: [
      "Phishing campaigns aimed at high-profile executives like CEOs or CFOs.",
      "Attacking naval navigation systems to divert cargo ships.",
      "Mass scanning of government databases to extract taxpayer metrics.",
      "Injecting malicious code snippets into public internet forums."
    ],
    correctAnswer: "Phishing campaigns aimed at high-profile executives like CEOs or CFOs.",
    category: "Phishing Awareness",
    difficulty: "medium"
  },
  {
    question: "What security headers help protect domains against spoofing and phishing?",
    options: [
      "CORS and Content-Security-Policy",
      "SPF, DKIM, and DMARC",
      "X-Content-Type-Options and X-Frame-Options",
      "Strict-Transport-Security and Referrer-Policy"
    ],
    correctAnswer: "SPF, DKIM, and DMARC",
    category: "Phishing Awareness",
    difficulty: "hard"
  },

  // --- Social Engineering ---
  {
    question: "An unknown person follows you through a secure office door without scanning their badge. What is this behavior called?",
    options: [
      "Door busting",
      "Tailgating (or piggybacking)",
      "Co-working access",
      "Intrusive shadowing"
    ],
    correctAnswer: "Tailgating (or piggybacking)",
    category: "Social Engineering",
    difficulty: "easy"
  },
  {
    question: "What is 'Baiting' in social engineering?",
    options: [
      "Flooding a user's inbox with spam until they click a malware attachment.",
      "Leaving malware-infected media (like USB drives) in public locations to lure victims into using them.",
      "Posing as a support executive on the phone to extract database access keys.",
      "Creating fake social media profiles to extract passwords from users."
    ],
    correctAnswer: "Leaving malware-infected media (like USB drives) in public locations to lure victims into using them.",
    category: "Social Engineering",
    difficulty: "medium"
  },
  {
    question: "Which of the following defines 'Pretexting'?",
    options: [
      "Simulating computer keyboard strokes to bypass lock screens.",
      "An attack where the adversary creates a fabricated scenario to trick targets into sharing credentials.",
      "Intercepting text messages sent to candidates during multi-factor prompts.",
      "Scanning open ports on a server to detect security flaws."
    ],
    correctAnswer: "An attack where the adversary creates a fabricated scenario to trick targets into sharing credentials.",
    category: "Social Engineering",
    difficulty: "medium"
  },
  {
    question: "What is 'Watering Hole' attack?",
    options: [
      "Flooding corporate irrigation systems to compromise data centers.",
      "Compromising a specific, trusted website frequently visited by a target group.",
      "Dumping fake credentials in administrative forums to capture logins.",
      "Poisoning routing tables on public Wi-Fi hotspots."
    ],
    correctAnswer: "Compromising a specific, trusted website frequently visited by a target group.",
    category: "Social Engineering",
    difficulty: "hard"
  },

  // --- Email Security ---
  {
    question: "Why should you avoid using your corporate email address for personal services?",
    options: [
      "It makes it harder for IT managers to monitor your personal purchases.",
      "Personal service breaches could leak credentials and expose the corporate network to attacks.",
      "Corporate servers block all personal confirmation emails.",
      "Personal emails consume massive amounts of hard drive space on servers."
    ],
    correctAnswer: "Personal service breaches could leak credentials and expose the corporate network to attacks.",
    category: "Email Security",
    difficulty: "easy"
  },
  {
    question: "What is the primary function of PGP (Pretty Good Privacy) in email communications?",
    options: [
      "Automatically filtering out spam and commercial advertisements.",
      "Providing end-to-end encryption and digital signatures for emails.",
      "Translating incoming foreign emails into your local language.",
      "Blocking malware links before they can be clicked by users."
    ],
    correctAnswer: "Providing end-to-end encryption and digital signatures for emails.",
    category: "Email Security",
    difficulty: "medium"
  },
  {
    question: "What does 'DMARC' accomplish in email security?",
    options: [
      "It encrypts email contents before they traverse the web.",
      "It instructs receiving servers on how to handle emails that fail SPF/DKIM checks.",
      "It scans attachments for active malware scripts.",
      "It matches the recipient's identity with their active directory profile."
    ],
    correctAnswer: "It instructs receiving servers on how to handle emails that fail SPF/DKIM checks.",
    category: "Email Security",
    difficulty: "hard"
  },

  // --- Device Security ---
  {
    question: "What should you do when leaving your workspace computer, even for a short break?",
    options: [
      "Turn off the computer screen monitor.",
      "Lock your system screen (e.g. Win+L).",
      "Shut down the active browser windows.",
      "Leave a note stating 'Back in 5 minutes'."
    ],
    correctAnswer: "Lock your system screen (e.g. Win+L).",
    category: "Device Security",
    difficulty: "easy"
  },
  {
    question: "Why is it dangerous to plug in unverified USB thumb drives into your work laptop?",
    options: [
      "They could overload the computer's USB port electrical circuits.",
      "They could automatically execute malware or steal files from your computer.",
      "They could change the default keyboard language settings.",
      "They could format the drive without user permission."
    ],
    correctAnswer: "They could automatically execute malware or steal files from your computer.",
    category: "Device Security",
    difficulty: "easy"
  },
  {
    question: "What does 'BYOD' stand for, and what is its associated security risk?",
    options: [
      "Backup Your Own Data: Risk of losing critical documents.",
      "Bring Your Own Device: Risk of malware introducing flaws to corporate networks.",
      "Bypass Your Online Defender: Risk of running scripts without shields.",
      "Build Your Own Database: Risk of duplicating metadata schemas."
    ],
    correctAnswer: "Bring Your Own Device: Risk of malware introducing flaws to corporate networks.",
    category: "Device Security",
    difficulty: "medium"
  },
  {
    question: "In mobile device management, what does 'containerization' achieve?",
    options: [
      "Compiling multiple applications into a single execution bundle.",
      "Isolating corporate data from personal data on a mobile device.",
      "Encrypting the physical memory chips on the motherboard.",
      "Backing up system image files to cloud buckets."
    ],
    correctAnswer: "Isolating corporate data from personal data on a mobile device.",
    category: "Device Security",
    difficulty: "hard"
  },

  // --- Safe Browsing ---
  {
    question: "What does the 'https://' prefix in a URL indicate?",
    options: [
      "The website is verified as safe and containing zero malware.",
      "Data sent between your browser and the website is encrypted.",
      "The website belongs to a registered government agency.",
      "The site loads faster because it uses caching protocols."
    ],
    correctAnswer: "Data sent between your browser and the website is encrypted.",
    category: "Safe Browsing",
    difficulty: "easy"
  },
  {
    question: "What is a 'Drive-By Download'?",
    options: [
      "Downloading a file while riding in a moving vehicle.",
      "Malicious software that downloads to a user's system simply by visiting a compromised website, without active user interaction.",
      "An automated process that updates browser extensions in the background.",
      "Uploading large documents to cloud storage using cellular links."
    ],
    correctAnswer: "Malicious software that downloads to a user's system simply by visiting a compromised website, without active user interaction.",
    category: "Safe Browsing",
    difficulty: "medium"
  },
  {
    question: "How does a website's SSL/TLS certificate ensure security?",
    options: [
      "It blocks malicious code execution on the server.",
      "It encrypts communication channels and validates the identity of the domain owner.",
      "It verifies that all site contents have been virus-scanned.",
      "It limits database access rights to authorized web editors."
    ],
    correctAnswer: "It encrypts communication channels and validates the identity of the domain owner.",
    category: "Safe Browsing",
    difficulty: "medium"
  },
  {
    question: "What security concern does the HTTP header 'Strict-Transport-Security' (HSTS) address?",
    options: [
      "It prevents SQL injection vulnerabilities.",
      "It forces browsers to load the site using secure HTTPS connections exclusively, blocking SSL stripping.",
      "It limits client side file upload sizes.",
      "It blocks scripts running on third-party domains."
    ],
    correctAnswer: "It forces browsers to load the site using secure HTTPS connections exclusively, blocking SSL stripping.",
    category: "Safe Browsing",
    difficulty: "hard"
  },

  // --- Malware ---
  {
    question: "What is a 'Computer Worm'?",
    options: [
      "Malware that requires a host program to run and attach itself to.",
      "Self-replicating malware that spreads across networks without needing a host program or human intervention.",
      "A script that captures keyboard keystrokes to steal passwords.",
      "Malware that masquerades as useful utility software."
    ],
    correctAnswer: "Self-replicating malware that spreads across networks without needing a host program or human intervention.",
    category: "Malware",
    difficulty: "medium"
  },
  {
    question: "What is a 'Trojan Horse' in software security?",
    options: [
      "A hardware component that logs communications on server buses.",
      "Malware that disguises itself as legitimate, safe software to trick users into running it.",
      "A script that disables corporate firewalls automatically.",
      "Security patches that fix bugs in operating systems."
    ],
    correctAnswer: "Malware that disguises itself as legitimate, safe software to trick users into running it.",
    category: "Malware",
    difficulty: "easy"
  },
  {
    question: "What is 'Spyware' designed to do?",
    options: [
      "Monitor and collect information about a user's internet activities and keystrokes without consent.",
      "Encrypt files on your hard drive and demand currency to decrypt them.",
      "Overload server CPUs to crash active websites.",
      "Intercept local network traffic to redirect users to fake search sites."
    ],
    correctAnswer: "Monitor and collect information about a user's internet activities and keystrokes without consent.",
    category: "Malware",
    difficulty: "easy"
  },
  {
    question: "What does a 'Rootkit' target on a system?",
    options: [
      "User profile icons and display configurations.",
      "Deep administrative and operating system levels to hide its existence from detection tools.",
      "Database schema definitions and tables.",
      "Local browser bookmarks and saved passwords."
    ],
    correctAnswer: "Deep administrative and operating system levels to hide its existence from detection tools.",
    category: "Malware",
    difficulty: "hard"
  },
  {
    question: "Which of the following matches the description of a 'Logic Bomb'?",
    options: [
      "An automated password cracker testing sequences.",
      "Malware that triggers its malicious payload only when specific logical conditions or timestamps are met.",
      "Hardware errors that cause memory chips to failure.",
      "A vulnerability scanner that detects outdated dependencies."
    ],
    correctAnswer: "Malware that triggers its malicious payload only when specific logical conditions or timestamps are met.",
    category: "Malware",
    difficulty: "hard"
  },

  // --- Ransomware ---
  {
    question: "What is the main objective of 'Ransomware'?",
    options: [
      "To flood user browsers with annoying advertising popups.",
      "To encrypt system files and demand payment to restore access.",
      "To copy email contact lists and dispatch spam emails.",
      "To disable system antivirus shields silently."
    ],
    correctAnswer: "To encrypt system files and demand payment to restore access.",
    category: "Ransomware",
    difficulty: "easy"
  },
  {
    question: "Which of the following is the most effective defense against ransomware attacks?",
    options: [
      "Installing multiple browser ad-block extensions.",
      "Maintaining offline, immutable, and regularly verified backups.",
      "Changing login passwords every 24 hours.",
      "Running database query sanitizers on forms."
    ],
    correctAnswer: "Maintaining offline, immutable, and regularly verified backups.",
    category: "Ransomware",
    difficulty: "medium"
  },
  {
    question: "What does 'Double Extortion' mean in ransomware campaigns?",
    options: [
      "Charging double the ransom fee if the deadline is missed.",
      "Encrypting files and threatening to leak sensitive data publicly if payment is refused.",
      "Attacking both the employee's work system and personal device.",
      "Demanding ransom from both the company and their insurance provider."
    ],
    correctAnswer: "Encrypting files and threatening to leak sensitive data publicly if payment is refused.",
    category: "Ransomware",
    difficulty: "medium"
  },
  {
    question: "What is 'Wiper Malware', and how does it differ from ransomware?",
    options: [
      "It clears browser history data instead of encrypting it.",
      "It deletes data permanently with no decryption key available, purely for destruction.",
      "It requires payments to be made in gold instead of cryptocurrency.",
      "It targets printer memory queues to block prints."
    ],
    correctAnswer: "It deletes data permanently with no decryption key available, purely for destruction.",
    category: "Ransomware",
    difficulty: "hard"
  },

  // --- Data Protection ---
  {
    question: "What does 'Data Encryption at Rest' mean?",
    options: [
      "Encrypting data files when they are traversing network pipes.",
      "Encrypting data stored statically on physical hard drives, SSDs, or backups.",
      "Deleting files when the computer enters Sleep Mode.",
      "Locking databases to prevent modifications during maintenance windows."
    ],
    correctAnswer: "Encrypting data stored statically on physical hard drives, SSDs, or backups.",
    category: "Data Protection",
    difficulty: "easy"
  },
  {
    question: "What is 'PII' in compliance and privacy settings?",
    options: [
      "Port Intrusion Inspector: Alerts administrators on open ports.",
      "Personally Identifiable Information: Any data that can distinguish or trace an individual's identity.",
      "Program Integrity Interface: Validates code modules before execution.",
      "Private Internet Identifier: Masks client IP addresses."
    ],
    correctAnswer: "Personally Identifiable Information: Any data that can distinguish or trace an individual's identity.",
    category: "Data Protection",
    difficulty: "easy"
  },
  {
    question: "Which framework regulates data privacy and protections for European Union citizens?",
    options: [
      "HIPAA",
      "PCI-DSS",
      "GDPR",
      "SOX"
    ],
    correctAnswer: "GDPR",
    category: "Data Protection",
    difficulty: "medium"
  },
  {
    question: "What does a 'Data Loss Prevention' (DLP) system accomplish?",
    options: [
      "It automates local system image backups.",
      "It monitors and blocks sensitive data transfers to unauthorized external destinations.",
      "It hashes passwords securely in database schemas.",
      "It checks open ports to restrict DDoS attacks."
    ],
    correctAnswer: "It monitors and blocks sensitive data transfers to unauthorized external destinations.",
    category: "Data Protection",
    difficulty: "medium"
  },
  {
    question: "What is 'Homomorphic Encryption'?",
    options: [
      "An algorithm that changes keys with every keystroke.",
      "Encryption allowing mathematical computations to be performed on ciphertext directly, returning encrypted results.",
      "Using physical biological keys to encrypt files.",
      "Hashing files multiple times with unique salt values."
    ],
    correctAnswer: "Encryption allowing mathematical computations to be performed on ciphertext directly, returning encrypted results.",
    category: "Data Protection",
    difficulty: "hard"
  },

  // --- Network Security ---
  {
    question: "What does a VPN (Virtual Private Network) do?",
    options: [
      "It automatically accelerates broadband download speeds.",
      "It establishes an encrypted connection tunnel to secure traffic, especially on public Wi-Fi networks.",
      "It shields the computer screen from unauthorized observers.",
      "It updates local system antivirus software dynamically."
    ],
    correctAnswer: "It establishes an encrypted connection tunnel to secure traffic, especially on public Wi-Fi networks.",
    category: "Network Security",
    difficulty: "easy"
  },
  {
    question: "Which network port is the standard default for secure HTTPS connections?",
    options: [
      "80",
      "21",
      "443",
      "8080"
    ],
    correctAnswer: "443",
    category: "Network Security",
    difficulty: "easy"
  },
  {
    question: "What does 'SSID' refer to in wireless networking?",
    options: [
      "A security certificate verified by wireless routers.",
      "The public name assigned to identify a wireless network.",
      "An encryption algorithm securing Wi-Fi access.",
      "A database logging client connections."
    ],
    correctAnswer: "The public name assigned to identify a wireless network.",
    category: "Network Security",
    difficulty: "easy"
  },
  {
    question: "What is a 'Man-in-the-Middle' (MitM) attack?",
    options: [
      "An attacker standing between the user and their desk computer to view the screen.",
      "An adversary intercepting and potentially altering communications between two parties without their knowledge.",
      "Flooding a router with fake packets to crash the network connection.",
      "Stealing backup tapes from data facilities."
    ],
    correctAnswer: "An adversary intercepting and potentially altering communications between two parties without their knowledge.",
    category: "Network Security",
    difficulty: "medium"
  },
  {
    question: "What is the primary difference between a Hub and a Switch in network architectures?",
    options: [
      "Hubs use encryption, while Switches do not.",
      "Hubs broadcast traffic to all ports, whereas Switches route traffic specifically to the destination port based on MAC addresses.",
      "Hubs are faster than Switches.",
      "Switches can only connect to database servers."
    ],
    correctAnswer: "Hubs broadcast traffic to all ports, whereas Switches route traffic specifically to the destination port based on MAC addresses.",
    category: "Network Security",
    difficulty: "medium"
  },
  {
    question: "What does the 'DNSSEC' protocol provide?",
    options: [
      "It encrypts all internet web page loads.",
      "It adds cryptographic signatures to DNS records to verify authenticity and prevent cache poisoning.",
      "It blocks connections from malicious IP pools.",
      "It translates private IP addresses to public ones."
    ],
    correctAnswer: "It adds cryptographic signatures to DNS records to verify authenticity and prevent cache poisoning.",
    category: "Network Security",
    difficulty: "hard"
  },
  {
    question: "What is 'IP Spoofing'?",
    options: [
      "Stealing an IP address by physical cutting of network cables.",
      "Forging the source IP address in packet headers to hide identity or impersonate a trusted system.",
      "Setting routers to cycle IP addresses hourly.",
      "Blocking incoming packets from administrative subnets."
    ],
    correctAnswer: "Forging the source IP address in packet headers to hide identity or impersonate a trusted system.",
    category: "Network Security",
    difficulty: "hard"
  },
  {
    question: "In firewalls, what does 'Stateful Packet Inspection' (SPI) track?",
    options: [
      "The physical state of the hardware routing ports.",
      "The active state of network connections, evaluating packets based on context of existing sessions rather than isolation.",
      "The geographic destination city of outgoing requests.",
      "The database queries submitted in text fields."
    ],
    correctAnswer: "The active state of network connections, evaluating packets based on context of existing sessions rather than isolation.",
    category: "Network Security",
    difficulty: "hard"
  },
  {
    question: "What is the term for a social engineering attack that happens over a telephone call?",
    options: [
      "Phishing",
      "Vishing",
      "Smishing",
      "Baiting"
    ],
    correctAnswer: "Vishing",
    category: "Social Engineering",
    difficulty: "easy"
  },
  {
    question: "What is the term for a phishing attack that takes place over SMS/text messages?",
    options: [
      "Vishing",
      "Smishing",
      "Baiting",
      "Whaling"
    ],
    correctAnswer: "Smishing",
    category: "Phishing Awareness",
    difficulty: "medium"
  },
  {
    question: "What does the lock icon in the browser address bar indicate?",
    options: [
      "The website is completely safe and free from any malware.",
      "The connection is encrypted via SSL/TLS.",
      "The site has locked you out from editing its source files.",
      "Your local antivirus has scanned the link."
    ],
    correctAnswer: "The connection is encrypted via SSL/TLS.",
    category: "Safe Browsing",
    difficulty: "easy"
  },
  {
    question: "Which of the following is a prominent historical example of a global ransomware outbreak that occurred in 2017?",
    options: [
      "Stuxnet",
      "WannaCry",
      "Heartbleed",
      "Log4j"
    ],
    correctAnswer: "WannaCry",
    category: "Ransomware",
    difficulty: "hard"
  }
];

module.exports = questions;
