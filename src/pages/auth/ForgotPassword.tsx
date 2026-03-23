import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o e-mail. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            O2 <span className="text-primary">CRM</span>
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recuperar senha</CardTitle>
            <CardDescription>
              {sent
                ? "Verifique seu e-mail para o link de recuperação."
                : "Informe seu e-mail para receber o link de recuperação."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar link"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-muted-foreground"
                  onClick={() => navigate("/login")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
