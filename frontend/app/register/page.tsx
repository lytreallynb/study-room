import Nav from "../../components/Nav";
import AuthForm from "../../components/AuthForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-16">
        <AuthForm mode="register" />
      </main>
    </div>
  );
}
