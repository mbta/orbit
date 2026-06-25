import { createContext, ReactNode, useContext, useState } from "react";

export type DataWarning = { VEHICLE_POSITIONS_STALE: boolean };

const DataWarningsContext = createContext<any>(null);
export const DataWarningsProvider = ({ children }: { children: ReactNode }) => {
  const [warnings, setWarnings] = useState<DataWarning>({
    VEHICLE_POSITIONS_STALE: false,
  });
  return (
    <DataWarningsContext.Provider value={[warnings, setWarnings]}>
      {children}
    </DataWarningsContext.Provider>
  );
};

export const useDataWarnings = () => useContext(DataWarningsContext);
