export type TimetableClass = {
  code: string;
  name: string;
  room: string;
  teachers: string[];
};

export type MorningProgram = {
  department: "BSIT" | "BSSW" | "BSDS";
  section: "P-I" | "P-II" | "P-III" | "P-IV";
  classes: Record<string, TimetableClass>;
  days: Record<"MON" | "TUE" | "WED" | "THU" | "FRI", string>;
};

const hall = "Lecture Hall @ Hitech";
const room1 = "Room No 1";
const room2 = "Room No 2";
const room8 = "Room No 8";
const room10 = "Room No 10";
const room20 = "Room No 20";
const room22 = "Room No 22";
const lab1 = "Comp Lab I";
const lab2 = "Comp Lab II";
const classroom = "CL Classroom";
const microLab = "Microprocessor Lab";
const unassignedRoom = "Room not specified in PDF";
const unassignedTeacher = "Unassigned instructor (not listed in PDF)";

function c(
  code: string,
  name: string,
  room: string,
  ...teachers: string[]
): TimetableClass {
  return { code, name, room, teachers };
}

export const morningPrograms2026: MorningProgram[] = [
  {
    department: "BSIT",
    section: "P-I",
    classes: {
      A: c("GICP-302", "Ideology and Constitution of Pakistan", room22, "Mr. Ahmed Hussain Shah"),
      B: c("IT26-321", "Object Oriented Programming", lab2, "Dr. Bilal Shaikh"),
      C: c("GQUR-322", "Calculus & Analytical Geometry", hall, "Engr. Noorulain Patoli"),
      D: c("DCMT-308", "Mathematics-II (Pre-Medical Only)", hall, "Dr. Rahat Ali"),
      E: c("IT26-326", "Digital Logic Design", room10, "Dr. Fauzia Talpur"),
      F: c("GUHQ-303", "Understanding of Quran I / History I", hall, "Mr. Jamshed", "Dr. Bashir Ahmed Jatoi"),
      G: c("GENG-312", "Expository Writing", hall, "Ms. Asmat Fatima"),
      H: c("GSOS-324", "Introduction to Management", hall, "Mr. Zulfiqar Ali Bhutto"),
      I: c("IT26-327", "Digital Logic Design", microLab, "Dr. Fauzia Talpur"),
      J: c("IT26-320", "Object Oriented Programming", room22, "Dr. Bilal Shaikh"),
    },
    days: {
      MON: "A A B B . C D",
      TUE: "E E . . F F D",
      WED: "G C C B . . D",
      THU: "I I . J J H .",
      FRI: ". G G H . . .",
    },
  },
  {
    department: "BSIT",
    section: "P-II",
    classes: {
      A: c("IT24-431", "Computer Graphics and Game Development", lab2, "Dr. M. Ali Nizamani"),
      B: c("IT24-426", "Web Technologies", room8, "Dr. Zeeshan Bhatti"),
      C: c("IT24-428", "Multivariable Calculus", room8, "Engr. Umair Abro"),
      D: c("IT24-425", "Computer Networks", "Comp Lab I", "Mr. Aslam Kumbhar"),
      E: c("IT24-430", "Computer Graphics and Game Development", room8, "Dr. M. Ali Nizamani"),
      F: c("IT24-422", "Database Systems", room8, "Mr. Junaid Javed"),
      G: c("IT24-427", "Web Technologies", "Comp Lab I", "Dr. Zeeshan Bhatti"),
      H: c("GENT-432", "Entrepreneurship", room22, "Dr. Arifa Bhutto"),
      I: c("IT24-422", "Database Systems", room22, "Mr. Junaid Javed"),
      J: c("IT24-424", "Computer Networks", room22, "Mr. Aslam Kumbhar"),
      K: c("IT24-423", "Database Systems", lab2, "Mr. Junaid Javed"),
      L: c("IT24-428", "Multivariable Calculus", room22, "Engr. Umair Abro"),
    },
    days: {
      MON: "A A A B B . C",
      TUE: "D D E E F F .",
      WED: ". G G H H I I",
      THU: "J J K K K . .",
      FRI: "L L J . . . .",
    },
  },
  {
    department: "BSIT",
    section: "P-III",
    classes: {
      A: c("IT24-530", "Introduction to Marketing", classroom, "Dr. Hakim Ali Mahesar"),
      B: c("IT24-524", "Cloud Computing", classroom, "Mr. Junaid Javed"),
      C: c("IT24-523", "Parallel and Distributed Computing", lab2, "Dr. Lachhman Das"),
      D: c("IT24-520", "Information Technology Infrastructure", classroom, "Mr. Hassan Jhatial"),
      E: c("IT24-522", "Parallel and Distributed Computing", classroom, "Dr. Lachhman Das"),
      F: c("IT24-526", "Data Mining", classroom, "Dr. Faheem Abbasi"),
      G: c("IT24-527", "Data Mining", lab2, "Dr. Faheem Abbasi", "Mr. Junaid Javed"),
      H: c("IT24-525", "Cloud Computing", lab2, "Mr. Junaid Javed"),
    },
    days: {
      MON: "A A B B C C .",
      TUE: "D D D A E . .",
      WED: "D F F E E . .",
      THU: ". . . G G H H",
      FRI: ". . . . . . .",
    },
  },
  {
    department: "BSIT",
    section: "P-IV",
    classes: {
      A: c("INFT-621", "Systems and Network Administration", lab1, "Dr. Bilal Shaikh"),
      B: c("INFT-626", "Professional Practices", room22, "Dr. M. Ali Memon"),
      C: c("INFT-622", "Network Science", room22, "Dr. Abdul Waheed"),
      D: c("INFT-624", "Cyber Security", room22, "Dr. Shiraz Leghari"),
      E: c("INFT-620", "Systems and Network Administration", room22, "Dr. Bilal Shaikh"),
      F: c("INFT-624", "Cyber Security", room22, "Dr. Shiraz Leghari"),
      G: c("INFT-623", "Network Science", lab1, "Dr. Abdul Waheed"),
      H: c("INFT-629", "Final Year Project Part-II", unassignedRoom, unassignedTeacher),
    },
    days: {
      MON: "A A B B C C D",
      TUE: "E E F F . G G",
      WED: "H H H . . . .",
      THU: ". . . . . . .",
      FRI: ". . . . . . .",
    },
  },
  {
    department: "BSSW",
    section: "P-I",
    classes: {
      A: c("SE26-320", "Digital Logic Design", hall, "Dr. Fauzia Talpur"),
      B: c("SE26-322", "Object Oriented Programming", hall, "Engr. Aamir Mal"),
      C: c("SE26-324", "Software Engineering", hall, "Dr. M. Ali Memon"),
      D: c("DCMT-308", "Mathematics-II (Pre-Medical Only)", hall, "Dr. Rahat Ali"),
      E: c("GICP-302", "Ideology and Constitution of Pakistan", hall, "Mr. Ahmed Hussain Shah"),
      F: c("GQUR-322", "Discrete Structures", hall, "Dr. Arjumand Bano"),
      G: c("GSOS-324", "Introduction to Management", room22, "Dr. Asif Ali Jamali"),
      H: c("SE26-323", "Object Oriented Programming", lab2, "Engr. Aamir Mal"),
      I: c("GUHQ-301", "Understanding Holy Quran-I / History-I", hall, "Mr. Jamshed", "Dr. Bashir Ahmed Jatoi"),
      J: c("GENG-312", "Expository Writing", hall, "Ms. Murk Masooma"),
      K: c("SE26-321", "Digital Logic Design", microLab, "Dr. Fauzia Talpur"),
      L: c("GENG-312", "Expository Writing", room8, "Ms. Murk Masooma"),
    },
    days: {
      MON: "A A B B C . D",
      TUE: "E E F G . . D",
      WED: "G G H H I I D",
      THU: "J J F F C C .",
      FRI: "K K L . . . .",
    },
  },
  {
    department: "BSSW",
    section: "P-II",
    classes: {
      A: c("SE24-410", "Computer Organization and Assembly Language", room10, "Dr. Arjumand Bano"),
      B: c("GENT-432", "Entrepreneurship", room10, "Dr. Arifa Bhutto"),
      C: c("SE24-408", "Probability & Statistics", room10, "Dr. Rafique"),
      D: c("SE24-416", "Data Science", room8, "Dr. Niaz Hussain Arijo"),
      E: c("SE24-414", "Web Technologies", room8, "Dr. Mumtaz Qabulio"),
      F: c("SE24-417", "Data Science", lab1, "Dr. Niaz Hussain Arijo"),
      G: c("SE24-413", "Software Requirement Engineering", lab2, "Engr. Noorulain Patoli"),
      H: c("SE24-415", "Web Technologies", lab2, "Dr. Mumtaz Qabulio"),
      I: c("SE24-412", "Software Requirement Engineering", room10, "Engr. Noorulain Patoli"),
      J: c("SE24-411", "Computer Organization and Assembly Language", lab2, "Dr. Arjumand Bano"),
    },
    days: {
      MON: "A A B B C C C",
      TUE: ". . . . . . .",
      WED: "D D E F F G G",
      THU: "H H E I I C C",
      FRI: "J J . . . . .",
    },
  },
  {
    department: "BSSW",
    section: "P-III",
    classes: {
      A: c("SE24-518", "Mobile Application And Development", room8, "Mr. Mir Hazar Khan"),
      B: c("SE24-513", "Software Project Management", room8, "Dr. Kamran Taj"),
      C: c("SE24-514", "Parallel and Distributed Computing", room8, "Mr. Junaid Javed"),
      D: c("SE24-516", "Software Construction and Development", room8, "Engr. Aamir Mal"),
      E: c("SE24-511", "Information Security", lab2, "Dr. Mumtaz Qabulio"),
      F: c("SE24-519", "Mobile Application And Development", lab2, "Mr. Mir Hazar Khan"),
      G: c("SE24-510", "Information Security", room8, "Dr. Mumtaz Qabulio"),
      H: c("SE24-515", "Parallel and Distributed Computing", lab1, "Mr. Junaid Javed"),
      I: c("SE24-512", "Software Project Management", room8, "Dr. Kamran Taj"),
      J: c("SE24-517", "Software Construction and Development", lab2, "Engr. Aamir Mal"),
    },
    days: {
      MON: "A A B B . C .",
      TUE: "C D D . E E .",
      WED: "F F . G G . .",
      THU: "H H I I J J .",
      FRI: ". . . . . . .",
    },
  },
  {
    department: "BSSW",
    section: "P-IV",
    classes: {
      A: c("SE23-618", "Final Year Project (Part-II)", unassignedRoom, unassignedTeacher),
      B: c("SE23-615", "Software Re-Engineering", lab2, "Mr. Rafique Ahmed"),
      C: c("SE23-616", "Game Application", room10, "Mr. Mir Hazar Khan"),
      D: c("SE23-612", "Information Security", room10, "Dr. Asif Ali Jamali"),
      E: c("SE23-610", "Professional Practices", room10, "Dr. Imran Ujjan"),
      F: c("SE23-614", "Software Re-Engineering", room10, "Mr. Rafique Ahmed"),
      G: c("SE23-617", "Game Application", lab1, "Mr. Mir Hazar Khan"),
    },
    days: {
      MON: "A A A . . . .",
      TUE: "B B C C D E E",
      WED: "F F C D D G G",
      THU: ". . . . . . .",
      FRI: ". . . . . . .",
    },
  },
  {
    department: "BSDS",
    section: "P-I",
    classes: {
      A: c("GSOS-324", "Introduction to Management", room20, "Dr. Asif Ali Jamali"),
      B: c("GUHQ-303", "Understanding of Quran I / History I", room20, "Mr. Jamshed", "Dr. Bashir Ahmed Jatoi"),
      C: c("DS26-320", "Object Oriented Programming", room20, "Dr. Bilal Shaikh"),
      D: c("DCMT-308", "Mathematics-II (Pre-Medical Only)", hall, "Dr. Rahat Ali"),
      E: c("GQUR-322", "Calculus & Analytical Geometry", room20, "Engr. Noorulain Patoli"),
      F: c("DS26-321", "Object Oriented Programming", lab2, "Dr. Bilal Shaikh"),
      G: c("GICP-302", "Ideology and Constitution of Pakistan", room20, "Mr. Ahmed Hussain Shah"),
      H: c("GENG-312", "Expository Writing", room20, "Mr. GM Keerio"),
      I: c("DS26-326", "Digital Logic Design", room20, "Dr. Fauzia Talpur"),
      J: c("DS26-327", "Digital Logic Design", microLab, "Dr. Fauzia Talpur"),
    },
    days: {
      MON: "A A B B C C D",
      TUE: "E E F F . . D",
      WED: "G G H H I I D",
      THU: "H E C J J . .",
      FRI: ". . . . . . .",
    },
  },
  {
    department: "BSDS",
    section: "P-II",
    classes: {
      A: c("GENT-431", "Entrepreneurship", room1, "Dr. Rafique Ahmed"),
      B: c("DS24-430", "Advanced Statistics", room1, "Dr. Shazia Abbasi"),
      C: c("DS24-425", "Computer Networks", lab1, "Dr. Nisar Memon"),
      D: c("DS24-427", "Artificial Intelligence", lab1, "Dr. M. Ali Nizamani"),
      E: c("DS24-428", "Multivariable Calculus", room1, "Engr. Umair Abro"),
      F: c("DS24-422", "Database Systems", room1, "Dr. Kamran Dahri"),
      G: c("DS24-423", "Database Systems", lab1, "Dr. Kamran Dahri", "Mr. Hassan Jhatial"),
      H: c("DS24-426", "Artificial Intelligence", room1, "Dr. M. Ali Nizamani"),
      I: c("DS24-424", "Computer Networks", room1, "Dr. Nisar Memon"),
    },
    days: {
      MON: "A B C C D D D",
      TUE: "E E F G G H H",
      WED: "B B I F F . .",
      THU: "A E I I . . .",
      FRI: ". . . . . . .",
    },
  },
  {
    department: "BSDS",
    section: "P-III",
    classes: {
      A: c("DS24-530", "Introduction to Marketing", room2, "Ms. Priya Babar"),
      B: c("DS24-524", "Artificial Neural Networks & Deep Learning", room2, "Dr. Niaz Hussain Arijo"),
      C: c("DS24-526", "Design and Analysis of Algorithms", room2, "Engr. Aamir Mal"),
      D: c("DS24-522", "Parallel and Distributed Computing", room2, "Dr. Atia Bano"),
      E: c("DS24-520", "Data Mining", room2, "Dr. Faheem Abbasi"),
      F: c("DS24-527", "Design and Analysis of Algorithms", lab1, "Engr. Aamir Mal"),
      G: c("DS24-521", "Data Mining", lab1, "Dr. Faheem Abbasi"),
      H: c("DS24-523", "Parallel and Distributed Computing", lab1, "Dr. Atia Bano"),
      I: c("DS24-525", "Artificial Neural Networks & Deep Learning", lab1, "Dr. Niaz Hussain Arijo"),
    },
    days: {
      MON: "A A B B C C .",
      TUE: "D D . E E . .",
      WED: ". . . . . . .",
      THU: "A . F F G G .",
      FRI: ". . H H I I .",
    },
  },
  {
    department: "BSDS",
    section: "P-IV",
    classes: {
      A: c("DASC-626", "Professional Practices", room1, "Dr. Imran Ujjan"),
      B: c("DASC-624", "Introduction to Sociology", room1, "Dr. Niaz Bhutto"),
      C: c("DASC-622", "Data Visualization", room1, "Dr. Atia Bano"),
      D: c("DASC-626", "Professional Practices", room20, "Dr. Imran Ujjan"),
      E: c("DASC-624", "Introduction to Sociology", room20, "Dr. Niaz Bhutto"),
      F: c("DASC-623", "Data Visualization", lab1, "Dr. Atia Bano"),
      G: c("DASC-629", "Final Year Project Part-II", room2, unassignedTeacher),
    },
    days: {
      MON: ". . A B C C .",
      TUE: ". . D D E E .",
      WED: ". . . . . . .",
      THU: ". . . . . . .",
      FRI: "F F G G . . .",
    },
  },
];

export const morningPeriodTimes = [
  ["08:30", "09:15"],
  ["09:15", "10:00"],
  ["10:00", "10:45"],
  ["10:45", "11:30"],
  ["11:30", "12:15"],
  ["12:15", "13:00"],
  ["13:00", "13:45"],
] as const;

export const timetableRooms2026 = [
  { name: hall, capacity: 120 },
  { name: room1, capacity: 40 },
  { name: room2, capacity: 40 },
  { name: room8, capacity: 40 },
  { name: room10, capacity: 40 },
  { name: room20, capacity: 40 },
  { name: room22, capacity: 40 },
  { name: lab1, capacity: 30 },
  { name: lab2, capacity: 30 },
  { name: classroom, capacity: 40 },
  { name: microLab, capacity: 30 },
  { name: unassignedRoom, capacity: 1 },
] as const;
