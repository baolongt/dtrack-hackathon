import React from "react";
import { LogoIcon } from "@/components/icons/LogoIcon";
import { LoginButton } from "./LoginButton";

interface LoginPageProps {}

const LoginPage: React.FC<LoginPageProps> = () => {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="hidden bg-muted lg:flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <LogoIcon className="h-24 w-24 text-primary" />
          <h2 className="text-4xl font-bold">Dtrack</h2>
          <p className="text-muted-foreground">
            Your Data Tracking Command Center.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6 text-center">
          <div className="grid gap-2">
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-balance text-muted-foreground">
              Click the button below to sign in with your Internet Identity.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="w-full flex justify-center">
              <LoginButton />
            </div>
          </div>
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
