# Azure RecognizeIT

Prosty projekt wykorzystujący chmurę Azure oraz sztuczną inteligencję do rozpoznawania obrazów.

Link do aplikacji na .azurestaticapps.net znajduje się w sekcji **About** na GitHubie.

## Jak to działa?

Użytkownik wchodzi na stronę aplikacji, przesyła zdjęcie i podaje maila.
Sztuczna inteligencja rozpoznaje obraz i dodaje krótki opis zdjęcia.
Wynik rozpoznawania przesyłany jest na podany adres email.

Pierwotnie było to rozpoznawanie twarzy celebrytów, ale niedawno Microsoft
[ograniczył dostęp do tego API](https://learn.microsoft.com/en-us/legal/cognitive-services/computer-vision/limited-access).

## Technologia i Zasoby

Całość opiera się na przetwarzaniu _serverless_, za co odpowiadają funkcje:

- `upload` - zapisuje zdjęcie do bazy
- `process` - uruchamia [AI](https://portal.vision.cognitive.azure.com/demo/image-captioning) do rozpoznawania obrazu
- `notify` - wysyła email z wynikiem

Pozostałe zasoby wykorzystane w projekcie:

- Azure Static Web App
- Azure Functions
- Azure AI services | Computer vision
- Azure Communication Service

Frontend napisany został w języku TypeScript z wykorzystaniem frameworka **solid.js**.

## Konfiguracja

Najpierw trzeba utworzyć zasoby komendą `terraform apply`, a następnie w Portalu Azure należy:

1. Utworzyć subdomenę do wysyłania maili i podpiąć ją do Communication Service
2. Podpiąć repozytorium GitHub z kodem UI do Static Webb Apps
3. Opublikować funkcje w Azure Functions\*

\* - niestety Static Web Apps [nie pozwalają](https://github.com/Azure/static-web-apps/issues/144) na wykorzystanie funkcji wyzwalanych inaczej niż poprzez _httpTrigger_ (funkcje **process** i **notify** są _queueTrigger_).
Dlatego konieczne jest opublikowanie ich ręcznie poleceniem `func publish`.
Pakujemy folder **functions/** do zipa i wrzucamy do cloudshella, a następnie:

```shell
$ unzip functions.zip
$ cd functions/
$ npm install typescript
$ npm run build
$ func azure functionapp publish psr-proj-function-app --typescript
```

## Debugowanie

Debugowanie funkcji _serverless_ może być nieco problematyczne, ale da się podejrzeć logi w Portalu Azure w zakładce **Log Stream**.
Szczegóły każdego wywołania widoczne są w zakładce **Functions/\<function\>/Monitor**.
