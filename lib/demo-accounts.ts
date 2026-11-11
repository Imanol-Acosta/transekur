export const demoPassword = "ArrivalDemo10!";

export const dispatchAccount = {
  id: "dispatch",
  role: "dispatch",
  name: "Alex Morgan",
  email: "dispatch@example.com",
} as const;

export const demoDrivers = [
  {
    id: "carlos",
    role: "driver",
    name: "Carlos Rivera",
    email: "carlos@example.com",
    vehicle: "Black Toyota Camry",
    vehicleEs: "Toyota Camry negro",
    plate: "DEMO-123",
  },
  {
    id: "lucia",
    role: "driver",
    name: "Lucía Santos",
    email: "lucia@example.com",
    vehicle: "White Hyundai Staria",
    vehicleEs: "Hyundai Staria blanco",
    plate: "DEMO-456",
  },
] as const;

export type DemoAccount = typeof dispatchAccount | (typeof demoDrivers)[number];
export type Role = DemoAccount["role"];

export const demoAccounts = [dispatchAccount, ...demoDrivers];

export function getDriver(id: string) {
  return demoDrivers.find((driver) => driver.id === id);
}
