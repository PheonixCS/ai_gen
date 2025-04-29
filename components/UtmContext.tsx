// components/UtmContext.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";

const RedirectWithParams = () => {
  const router = useRouter();

  useEffect(() => {
    // Получаем текущие параметры из URL
    const { query } = router;

    // Здесь вы можете определить логику редиректа
    const redirectTo = "/new-page"; // Замените на нужный вам путь

    // Создаем новый URL с параметрами
    const newUrl = {
      pathname: redirectTo,
      query: query, // Передаем параметры
    };

    // Выполняем редирект
    router.push(newUrl);
  }, [router]);

  return null; // Компонент ничего не рендерит
};

export default RedirectWithParams;
