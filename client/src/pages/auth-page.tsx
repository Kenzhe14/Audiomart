import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect } from "wouter";
import { Headphones } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();

  const loginForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", password: "" },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-[80vh] grid md:grid-cols-2 gap-8 items-center">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Welcome to AudioTech</h1>
          <p className="text-lg text-muted-foreground">
            Your one-stop shop for premium audio equipment. Sign in or create an
            account to start shopping.
          </p>
        </div>

        <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
          <Headphones className="w-32 h-32 text-primary" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit((data) => {
                    loginMutation.mutate(data);
                  })}
                  className="space-y-4"
                >
                  <Input
                    {...loginForm.register("username")}
                    placeholder="Username"
                  />
                  <Input
                    {...loginForm.register("password")}
                    type="password"
                    placeholder="Password"
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    Login
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form
                  onSubmit={registerForm.handleSubmit((data) => {
                    registerMutation.mutate(data);
                  })}
                  className="space-y-4"
                >
                  <Input
                    {...registerForm.register("username")}
                    placeholder="Username"
                  />
                  <Input
                    {...registerForm.register("password")}
                    type="password"
                    placeholder="Password"
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    Register
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
