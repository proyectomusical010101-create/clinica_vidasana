/* ==========================================================================
   DENTALCARE PRO - INITIAL SEEDED DATA (PERSISTENT DB MOCK)
   ========================================================================== */

const DEFAULT_EXCHANGE_RATE = 36.5; // 1 USD = 36.5 Bs.

const INITIAL_USERS = [
    {
        id: "usr-01",
        fullname: "Odontólogo General",
        email: "doctor@dentalcare.com",
        password: "123456",
        role: "Odontólogo Principal",
        license: "MPPS-84920 / C.O.V-14920",
        status: "Activo",
        createdAt: "2026-01-10"
    },
    {
        id: "usr-02",
        fullname: "Lic. Carla Benítez",
        email: "asistente@dentalcare.com",
        password: "123456",
        role: "Asistente Dental",
        license: "MPPS-99201",
        status: "Activo",
        createdAt: "2026-02-15"
    },
    {
        id: "usr-03",
        fullname: "Administrador General",
        email: "admin@dentalcare.com",
        password: "123456",
        role: "Super Administrador",
        license: "ADMIN-01",
        status: "Activo",
        createdAt: "2026-01-01"
    }
];

const INITIAL_BAREMO = [];

const INITIAL_INVENTORY = [];

const INITIAL_PATIENTS = [];

const INITIAL_APPOINTMENTS = [];

