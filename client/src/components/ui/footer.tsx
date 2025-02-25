import { Link } from "wouter";
import { Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">AudioTech</h3>
            <p className="text-sm text-muted-foreground">
              Ваш надежный магазин аудиотехники с широким выбором качественных товаров
              от ведущих производителей.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Информация</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                  О нас
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="text-sm text-muted-foreground hover:text-foreground">
                  Доставка
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-sm text-muted-foreground hover:text-foreground">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Каталог</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/?category=headphones" className="text-sm text-muted-foreground hover:text-foreground">
                  Наушники
                </Link>
              </li>
              <li>
                <Link href="/?category=speakers" className="text-sm text-muted-foreground hover:text-foreground">
                  Колонки
                </Link>
              </li>
              <li>
                <Link href="/?category=microphones" className="text-sm text-muted-foreground hover:text-foreground">
                  Микрофоны
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Свяжитесь с нами</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Email: info@audiotech.kz
              </p>
              <p className="text-sm text-muted-foreground">
                Тел: +7 (777) 777-77-77
              </p>
              <div className="flex gap-4 mt-4">
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} AudioTech. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
