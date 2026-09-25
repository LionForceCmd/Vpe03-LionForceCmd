# Учебный пульс

Учебный сервис для домашнего задания по варианту 2. Приложение позволяет добавлять учебные задачи, отмечать их выполнение и видеть текущую версию развёрнутого релиза. Данные задач хранятся только в `localStorage` браузера.

## Лицензия и ограничения

Проект создан исключительно для сдачи домашнего задания. Любое его использование, в том числе коммерческое или некоммерческое, запрещено.

## Возможности

- добавление задач с приоритетом;
- отметка выполнения и удаление задач;
- фильтры «Все», «Активные» и «Готово»;
- статистика и прогресс дня;
- сохранение задач между перезагрузками;
- отображение версии из `release.json`;
- endpoint проверки состояния `/health`.

## Стек

- HTML5;
- CSS3;
- JavaScript без внешних зависимостей;
- Nginx;
- Docker.

## Проверка локально

На компьютере должен быть установлен Docker Desktop.

```powershell
docker build -t study-pulse .
docker run --rm --name study-pulse -p 8080:80 study-pulse
```

После запуска откройте:

- приложение: `http://localhost:8080`;
- проверка состояния: `http://localhost:8080/health`.

Остановить контейнер:

```powershell
docker stop study-pulse
```

Если порт `8080` занят, укажите другой, например `-p 9090:80`, и используйте соответствующий адрес.

## Публикация в GitHub

Создай на GitHub приватный репозиторий, например `study-pulse`, без README и без `.gitignore`, затем выполни в папке проекта:

```powershell
git init -b main
git add .
git commit -m "Prepare study pulse application"
git remote add origin git@github.com:<твой_логин>/study-pulse.git
git push -u origin main
```

Если ключ для GitHub ещё не создан:

```powershell
ssh-keygen -t ed25519 -C "github-study-pulse" -f "$HOME/.ssh/github_study_pulse"
```

Публичный ключ `github_study_pulse.pub` добавь в GitHub в разделе **Settings → SSH and GPG keys → New SSH key**. Приватный ключ не публикуй и не отправляй в репозиторий.

## Выбор VPS

Для одного небольшого приложения и Coolify достаточно fresh-сервера с Ubuntu 24.04 LTS. Минимум Coolify — 2 vCPU, 2 ГБ RAM и 10 ГБ свободного диска. Для учебного сервера комфортнее взять 2 vCPU, 4 ГБ RAM и 30–40 ГБ NVMe с публичным IPv4.

Перед покупкой проверь:

1. доступна ли Ubuntu 24.04 LTS;
2. есть ли публичный IPv4;
3. разрешена ли регистрация SSH-ключа при создании сервера;
4. входит ли публичный IP в тариф;
5. можно ли увеличить ресурсы позже.

Пример подходящей конфигурации:

| Параметр | Значение |
| --- | --- |
| ОС | Ubuntu 24.04 LTS |
| Архитектура | x86-64 / amd64 |
| vCPU | 2 |
| RAM | 4 ГБ |
| Диск | 40 ГБ NVMe |
| IP | публичный IPv4 |

Провайдера можно выбрать любой. В рамках урока рассматривается Reg.ru.

## Подключение по SSH

Создай отдельный ключ для VPS:

```powershell
ssh-keygen -t ed25519 -C "study-pulse-vps" -f "$HOME/.ssh/study_pulse_vps"
```

Во время создания ключа задай устойчивую парольную фразу. Публичный ключ добавь в панели VPS-провайдера при создании сервера либо в файл `~/.ssh/authorized_keys` после первого входа по паролю.

Проверка подключения:

```powershell
ssh -i "$HOME/.ssh/study_pulse_vps" root@<IP_SERVER>
```

Для Cursor установи расширение **Remote SSH**, создай Host SSH entry и укажи путь к приватному ключу:

```sshconfig
Host study-pulse
    HostName <IP_SERVER>
    User root
    IdentityFile C:/Users/<твой_пользователь>/.ssh/study_pulse_vps
```

Затем выбери **Connect to Host → study-pulse** и открой удалённую папку `/root`.

## Подготовка Ubuntu и Coolify

Подключись к серверу по SSH и обнови систему:

```bash
sudo apt update
sudo apt upgrade -y
```

Установи Docker из официального скрипта:

```bash
curl -fsSL https://get.docker.com -o /tmp/install-docker.sh
less /tmp/install-docker.sh
sudo sh /tmp/install-docker.sh
docker version
docker compose version
```

Установи Coolify:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh -o /tmp/install-coolify.sh
less /tmp/install-coolify.sh
sudo bash /tmp/install-coolify.sh
```

Установщик выведет адрес панели. Если указан порт `8000`, открой:

```text
http://<IP_SERVER>:8000
```

Немедленно создай учётную запись администратора. Сразу после этого сохрани секреты Coolify:

```bash
sudo cp /data/coolify/source/.env ~/coolify.env.backup
sudo chmod 600 ~/coolify.env.backup
```

Не добавляй резервную копию `.env` в Git.

Если включён UFW, разреши необходимые порты до его активации:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 8000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Не включай firewall, пока не проверишь, что SSH-доступ не блокируется.

## Развёртывание в Coolify

### 1. Deploy key

1. Открой **Keys & Tokens → Private Keys** в Coolify.
2. Нажми **Add** и создай отдельный ED25519-ключ для этого репозитория.
3. Скопируй публичный ключ.
4. В GitHub открой репозиторий → **Settings → Deploy keys → Add deploy key**.
5. Добавь публичный ключ и оставь **Allow write access** выключенным: Coolify нужен только доступ на чтение.
6. Сохрани приватный ключ в настройках Coolify.

### 2. Новое приложение

1. Создай проект с названием `Study Pulse`.
2. Нажми **New** → **Private Repository (with deploy key)**.
3. Выбери сервер `localhost` и созданный ключ.
4. Укажи SSH-адрес репозитория:
   `git@github.com:<твой_логин>/study-pulse.git`
5. Выбери ветку `main`.
6. В качестве Build Pack выбери **Dockerfile**.
7. Оставь Base Directory `/`, а Dockerfile Location — `/Dockerfile`.
8. Укажи внутренний порт `80`.
9. Сохрани и нажми **Deploy**.

Если домен ещё не настроен, оставь сгенерированный Coolify тестовый адрес. Он использует IP-сервера, поэтому порт `80` должен быть доступен из интернета.

## Автодеплой

Для репозитория, подключённого через deploy key:

1. Открой приложение → **Configuration → Advanced → Deployment**.
2. Включи **Auto Deploy**.
3. Открой **Configuration → Webhooks**.
4. Задай длинный случайный **GitHub Webhook Secret** и сохрани его.
5. Скопируй **GitHub URL** в разделе **Manual Git Webhooks**.
6. В GitHub открой **Settings → Webhooks → Add webhook**.
7. Укажи:
   - Payload URL — URL из Coolify;
   - Content type — `application/json`;
   - Secret — тот же секрет, что сохранён в Coolify;
   - SSL verification — включена.
8. Выбери **Just the push event** и сохрани webhook.

Секрет вебхука нельзя публиковать или добавлять в репозиторий.

## Проверка тестового обновления

Измени `release.json`, например:

```json
{
  "version": "1.0.1",
  "message": "Автодеплой после тестового коммита",
  "deployedAt": "2026-09-24"
}
```

Выполни:

```powershell
git add release.json
git commit -m "Test automatic deployment"
git push
```

Проверь результат:

1. В GitHub открой webhook и убедись, что доставка Push имеет ответ `200 OK`.
2. В Coolify открой **Deployments** и дождись нового успешного деплоя.
3. Открой страницу с очисткой кеша `Ctrl+F5`.
4. Убедись, что отображается версия `1.0.1` и новое описание.
5. Открой `/health` и проверь ответ `ok`.

## Восстановление

### Приложение

1. Открой репозиторий на GitHub.
2. Проверь локальный репозиторий командой `git status`.
3. Восстанови последнюю рабочую версию из истории и повтори деплой.
4. В Coolify на странице **Deployments** выбери предыдущий успешный деплой и нажми **Redeploy**.

### Coolify

1. Подготовь чистый Ubuntu-сервер.
2. Установи Docker и Coolify заново.
3. Скопируй сохранённый `/data/coolify/source/.env` в тот же путь.
4. Восстанови резервную копию данных Coolify из настроек экземпляра.
5. Проверь сервер, ключи, приложение и автоматические деплои.

Если сервер восстановить дорого, проще развернуть чистый VPS и заново подключить GitHub-репозиторий: исходный код проекта хранится в Git.
