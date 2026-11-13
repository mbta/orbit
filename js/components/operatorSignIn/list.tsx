import { lookupDisplayName, useEmployees } from "../../hooks/useEmployees";
import { useSignins } from "../../hooks/useSignIns";
import { HeavyRailLine } from "../../types";
import { DateTime } from "luxon";
import { ReactElement } from "react";

export const List = ({ line }: { line: HeavyRailLine }): ReactElement => {
  const employees = useEmployees();
  const signIns = useSignins(line);
  const tdClassName =
    "border-y md:border-x p-1 border light:border-text-primary-light dark:border-text-primary-dark";

  if (signIns.status === "loading" || employees.status === "loading") {
    return <>Loading...</>;
  } else if (signIns.status === "error") {
    return <>Error retrieving signins.</>;
  } else if (employees.status === "error") {
    return <>Error retrieving employees.</>;
  }

  return (
    <table className="break-words text-[14px]">
      <colgroup>
        <col className="w-1/3" />
        <col className="w-1/5" />
        <col className="w-1/12" />
        <col />
      </colgroup>
      <tbody>
        <tr className="font-semibold">
          <td className={tdClassName}>Name</td>
          <td className={tdClassName}>Badge</td>
          <td className={tdClassName}>Radio</td>
          <td className={tdClassName}>Time</td>
          <td className={tdClassName}>Official</td>
        </tr>
        {signIns.result.map((si, idx) => (
          <tr key={idx}>
            <td className={`fs-mask ${tdClassName}`}>
              {lookupDisplayName(si.signed_in_employee, employees.result)}
            </td>
            <td className={`fs-mask ${tdClassName} break-all`}>
              {si.signed_in_employee}
            </td>
            <td className={`${tdClassName} break-all`}>{si.radio_number}</td>
            <td className={tdClassName}>
              {si.signed_in_at
                .toLocaleString(DateTime.TIME_SIMPLE)
                .replace(/ /g, "")}
            </td>
            <td
              className={`fs-mask ${tdClassName} break-words [hyphenate-character:'']`}
            >
              {si.signed_in_by.replace(
                /@/g,
                // 173 is a soft hyphen, which here acts as a breaking suggestion
                // We are hiding the hyphen above with CSS
                String.fromCharCode(173) + "@",
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
