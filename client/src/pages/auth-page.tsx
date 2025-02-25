import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Redirect } from "wouter";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: ""
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Вход в систему</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                  onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}
                  className="space-y-4"
              >
                <Input
                    {...form.register("username")}
                    placeholder="Имя пользователя"
                />
                <Input
                    {...form.register("password")}
                    type="password"
                    placeholder="Пароль"
                />
                <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                >
                  Войти
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => registerMutation.mutate(form.getValues())}
                    disabled={registerMutation.isPending}
                >
                  Зарегистрироваться
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
  );
}