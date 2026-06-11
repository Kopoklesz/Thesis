// A nyilvános referencia példány beállításai.
//
// REACT_APP_REFERENCE_MODE=true esetén a bejelentkezés legördülő menüből
// történik az alábbi minta fiókokkal, az önregisztráció pedig le van zárva
// (a backend a REFERENCE_MODE=true beállítással ugyanezt kényszeríti ki).
//
// A jelszó szándékosan publikus: a minta fiókok közösek, és a backend
// referencia módban nem engedi megváltoztatni.

export const REFERENCE_MODE = process.env.REACT_APP_REFERENCE_MODE === 'true';

export const REFERENCE_PASSWORD = 'PannonDemo1.';

export const REFERENCE_ACCOUNTS = [
  { username: 'admin', labelKey: 'ref_account_admin' },
  { username: 'TANAR1', labelKey: 'ref_account_teacher1' },
  { username: 'TANAR2', labelKey: 'ref_account_teacher2' },
  { username: 'DIAK01', labelKey: 'ref_account_student1' },
  { username: 'DIAK02', labelKey: 'ref_account_student2' },
];
