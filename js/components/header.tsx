export const Header = () => {
  return (
    <div className="w-full bg-gray-200 p-2 flex justify-between">
      <img src="/images/logo.svg" alt="MBTA" className="w-8" />
      <a href="/logout" className="underline p-1">
        Log out
      </a>
    </div>
  );
};
