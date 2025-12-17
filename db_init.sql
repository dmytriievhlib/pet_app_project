-- db_init.sql
CREATE DATABASE IF NOT EXISTS pet_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pet_app;

-- Користувач для проєкту
CREATE USER IF NOT EXISTS 'pet_user'@'localhost' IDENTIFIED BY '12345';
GRANT ALL PRIVILEGES ON pet_app.* TO 'pet_user'@'localhost';
FLUSH PRIVILEGES;

-- users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100),
  password VARCHAR(255)
);

-- pets (оновлена структура: document_number + owner_name + owner_phone + location)
CREATE TABLE IF NOT EXISTS pets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  type VARCHAR(50),
  breed VARCHAR(100),
  name VARCHAR(100) NOT NULL,
  birth_date DATE,
  document_number VARCHAR(50),      -- Номер документа тварини
  owner_name VARCHAR(100),          -- Власник (ім'я)
  owner_phone VARCHAR(20),          -- Телефон власника
  location VARCHAR(150),            -- Місце проживання
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- events
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pet_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_date DATE,
  description TEXT,
  clinic VARCHAR(150),
  location VARCHAR(150),
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Приклад даних
INSERT INTO pets (user_id, type, breed, name, birth_date, document_number, owner_name, owner_phone, location) VALUES
 (NULL, 'Собака', 'Лабрадор', 'Бобік', '2022-05-12', 'DOC-001', 'Іван', '+380501234567', 'Київ'),
 (NULL, 'Кіт', 'Сіамський', 'Мурчик', '2021-11-20', 'DOC-002', 'Оля', '+380631112233', 'Львів'),
 (NULL, 'Собака', 'Бігль', 'Урсус', '2013-03-09', 'DOC-003', 'Петро', '+380971112233', 'Одеса');

INSERT INTO events (pet_id, event_type, event_date, description, clinic, location) VALUES
(1, 'Щеплення', '2023-11-04', 'Вакцина проти сказу', 'Клініка А', 'м. Львів, вул. Лісова, 10'),
(2, 'Візит', '2023-10-15', 'Огляд у ветеринара', 'Клініка Б', 'м. Київ, пр. Центральний, 5'),
(3, 'Візит', '2025-12-09', 'вет. огляд', 'Клініка В', 'м. Лвів, вул. Миру, 8'),
(3, 'Щеплення', '2025-12-11', 'вакцинація', 'Клініка В', 'м. Львів, вул. Миру, 8');

-- Таблиця центрів виховання
CREATE TABLE IF NOT EXISTS training_centers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,       -- назва центру
  address VARCHAR(255),             -- адреса
  phone VARCHAR(50)                 -- телефон
);
CREATE TABLE IF NOT EXISTS trainers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  center_id INT NOT NULL,           -- зв'язок з центром
  name VARCHAR(100) NOT NULL,       -- ім'я тренера
  specialty VARCHAR(100),           -- спеціалізація (наприклад, "собаки")
  phone VARCHAR(50),
  FOREIGN KEY (center_id) REFERENCES training_centers(id) ON DELETE CASCADE
);
-- Приклад вставки центрів
INSERT INTO training_centers (name, address, phone) VALUES
('Кінологічний центр А', 'вул. Лісова, 12', '+380501112233'),
('Кінологічний центр Б', 'пр. Центральний, 5', '+380502223344');
-- Приклад вставки тренерів
INSERT INTO trainers (center_id, name, specialty, phone) VALUES
(1, 'Іван Петров', 'Собаки', '+380501234567'),
(1, 'Олег Коваль', 'Собаки', '+380501234568'),
(2, 'Марія Сидоренко', 'Собаки', '+380502345678');
-- Таблиця для дозвілля
CREATE TABLE IF NOT EXISTS leisure_places (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),         -- Наприклад: парк, кафе, магазин
  address VARCHAR(255),
  description TEXT
);
-- Приклад даних
INSERT INTO leisure_places (name, type, address, description) VALUES
('Парк ім. Шевченка', 'Парк', 'вул. Шевченка, 10', 'Велика зелена зона для вигулу собак'),
('Pet-Friendly Кафе "Doggo"', 'Кафе', 'вул. Франка, 22', 'Місце, де можна прийти з домашнім улюбленцем'),
('Зоомагазин "Happy Pets"', 'Магазин', 'вул. Лесі Українки, 5', 'Магазин для тварин і їхніх власників');
-- Таблиця заводчиків
CREATE TABLE IF NOT EXISTS breeders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,      -- Ім'я або назва заводчика
  animal_type VARCHAR(50),         -- Собака, Кіт
  phone VARCHAR(20),
  email VARCHAR(100),
  address VARCHAR(255),
  description TEXT
);
-- Приклади даних
INSERT INTO breeders (name, animal_type, phone, email, address, description) VALUES
('Заводчик Петро', 'Собака', '+380123456789', 'petro@breeder.com', 'м. Львів, вул. Лесі Українки, 10', 'Породи: Лабрадор, Бігль'),
('Заводчик Олена', 'Кіт', '+380987654321', 'olena@breeder.com', 'м. Львів, вул. Франка, 5', 'Породи: Сіамський, Мейн-кун');
-- Таблиця виставок
CREATE TABLE IF NOT EXISTS exhibitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,          -- Назва виставки
  animal_type VARCHAR(50),             -- Собака, Кіт
  start_date DATE NOT NULL,
  end_date DATE,
  location VARCHAR(255),               -- Місто, адреса
  description TEXT
);
-- Приклади даних
INSERT INTO exhibitions (name, animal_type, start_date, end_date, location, description) VALUES
('Всеукраїнська виставка собак', 'Собака', '2025-06-10', '2025-06-12', 'м. Київ, Парк Перемоги', 'Виставка всіх порід собак'),
('Виставка котів Львів 2025', 'Кіт', '2025-09-05', '2025-09-06', 'м. Львів, Палац Мистецтв', 'Виставка котів різних порід');
-- Таблиця нормативно-правової бази
CREATE TABLE IF NOT EXISTS regulations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,       -- Назва закону або правила
  document_type VARCHAR(100),        -- Закон, Постанова, Наказ, Інструкція
  url VARCHAR(255),                  -- Посилання на документ (опціонально)
  description TEXT                   -- Короткий опис
);
-- Приклади даних
INSERT INTO regulations (title, document_type, url, description) VALUES
('Закон України "Про захист тварин"', 'Закон', 'https://zakon.rada.gov.ua/laws/show/3447-15', 'Основні правила поводження та захист тварин в Україні'),
('Правила реєстрації собак і котів', 'Постанова', NULL, 'Реєстрація тварин у ветеринарних клініках та муніципальних службах');
CREATE TABLE IF NOT EXISTS animal_organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,       -- Назва організації
  description TEXT,                 -- Короткий опис / напрямки роботи
  website VARCHAR(255),             -- Сайт або контакт (опційно)
  phone VARCHAR(50),                -- Телефон (опційно)
  email VARCHAR(100)                -- Email (опційно)
);
INSERT INTO animal_organizations (name, description, website, phone, email) VALUES
('Happy Paw', 'Благодійний фонд: допомога притулкам, стерилізація, пошук домівок для собак/котів', 'https://happypaw.ua', '+380501234567', 'info@happypaw.ua'),
('UAnimals', 'Зоозахисна спільнота — евакуація, підтримка притулків, стерилізація, захист прав тварин', 'https://uanimals.org', '+380671234567', 'contact@uanimals.org'),
('Anomaly Ukraine', 'ГО, що працює з безпритульними: підтримка місцевих притулків, волонтерство, допомога тваринам', 'https://anomaly.org.ua', '+380631234567', 'animals@anomaly.org'),
('URSA', 'Громадська організація: рятує тварин, забезпечує ліками, надає юридичну допомогу у випадках жорстокого поводження', 'https://ursaua.com.ua', '+380661234567', 'info@ursaua.com'),
('LifeUA', 'Волонтерський / гуманітарний проєкт: рятує тварин, доставляє їжу/медикаменти, допомагає з прилаштуванням', 'https://lifeua.org', '+380991234567', 'support@lifeua.org');
CREATE TABLE IF NOT EXISTS news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,        -- Заголовок оголошення
  content TEXT NOT NULL,              -- Текст оголошення
  start_date DATE DEFAULT NULL,       -- Дата початку дії (опційно)
  end_date DATE DEFAULT NULL,         -- Дата закінчення дії (опційно)
  source VARCHAR(255) DEFAULT NULL    -- Джерело / організація, що публікує
);
INSERT INTO news (title, content, start_date, end_date, source) VALUES
('Сезонна обробка парків від кліщів', 
 'Міська рада повідомляє, що з 15 травня по 15 червня проводиться обробка паркових зон від шкідливих комах. Просимо власників собак утримувати тварин на повідку та уникати оброблених територій протягом 24 годин після обробки.', 
 '2025-05-15', '2025-06-15', 'Міська рада'),
('Вакцинація проти сказу для собак та котів', 
 'У суботу 20 червня в центрі ветеринарної медицини проводиться безкоштовна вакцинація домашніх тварин проти сказу. При собі мати паспорт тварини.', 
 '2025-06-20', NULL, 'Ветеринарний центр «Здоровий Пес»');

