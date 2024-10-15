interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="bg-white shadow-md py-4 px-6 flex items-center justify-center md:justify-between">
      <div className="flex items-center">
        <h1 className="text-lg md:text-xl font-bold text-gray-800">{title}</h1>
      </div>
    </header>
  );
}
