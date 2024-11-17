-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 17, 2024 at 04:55 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fast_uk`
--

-- --------------------------------------------------------

--
-- Table structure for table `faqs`
--

CREATE TABLE `faqs` (
  `id` int(255) NOT NULL,
  `ques` varchar(255) DEFAULT NULL,
  `ans` varchar(255) DEFAULT NULL,
  `status` tinyint(255) DEFAULT NULL,
  `faq_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faqs`
--

INSERT INTO `faqs` (`id`, `ques`, `ans`, `status`, `faq_image`) VALUES
(2, 'What is a dedicated delivery? 11', 'This means vehicle and driver is fully dedicated to your consignment only, no co-loading with anything or anyone\'s else load.', 1, '1729242435178-957864491.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

CREATE TABLE `members` (
  `id` int(20) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `mem_type` enum('customer','user') DEFAULT NULL,
  `mem_fname` varchar(255) DEFAULT NULL,
  `mem_mname` varchar(255) DEFAULT NULL,
  `mem_lname` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mem_phone` varchar(255) DEFAULT NULL,
  `mem_business_phone` text DEFAULT NULL,
  `password` text DEFAULT NULL,
  `mem_dob` text DEFAULT NULL,
  `mem_address1` text DEFAULT NULL,
  `mem_address2` text DEFAULT NULL,
  `mem_city` varchar(255) DEFAULT NULL,
  `mem_state` int(11) DEFAULT NULL,
  `mem_zip` varchar(255) DEFAULT NULL,
  `mem_bio` varchar(255) DEFAULT NULL,
  `mem_image` varchar(255) DEFAULT NULL,
  `mem_employee` tinyint(4) DEFAULT NULL,
  `mem_status` int(11) DEFAULT NULL,
  `mem_verified` tinyint(4) DEFAULT NULL,
  `mem_email_verified` tinyint(4) DEFAULT NULL,
  `mem_phone_verified` tinyint(4) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `otp` int(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`id`, `full_name`, `mem_type`, `mem_fname`, `mem_mname`, `mem_lname`, `email`, `mem_phone`, `mem_business_phone`, `password`, `mem_dob`, `mem_address1`, `mem_address2`, `mem_city`, `mem_state`, `mem_zip`, `mem_bio`, `mem_image`, `mem_employee`, `mem_status`, `mem_verified`, `mem_email_verified`, `mem_phone_verified`, `created_at`, `otp`) VALUES
(3, 'Ayan', 'user', NULL, NULL, NULL, 'ayan@gmail.com', '+44 7123 456 789', NULL, '$2b$10$kEMglpVpDF1FxGWtJ6se9utATcohkx3hxEx7IqSX.4UGFHF35.PJa', NULL, 'Pakistan', NULL, 'Sargodha', 0, NULL, NULL, '1730703198043-662504459.png', NULL, 1, 0, NULL, NULL, '2024-11-04 07:01:18', 773238),
(7, 'Naik khan', 'user', NULL, NULL, NULL, 'naik@gmail.com', '+44 1237 456 789', NULL, '$2b$10$JE8LpwbXaXFJVxpd/NPWIe.DCKTwpiolkaYVI8iVKgppIfSxiYhzC', NULL, 'Sargodha , Pakistan', NULL, 'Sargodha', 0, NULL, NULL, '1730703278534-92249136.png', NULL, 1, 0, NULL, NULL, '2024-11-04 07:01:36', 284803),
(10, 'Ayan', 'user', NULL, NULL, NULL, 'asifaa@gmail.com', NULL, NULL, '$2b$10$kexWMyM60gq134jzZseRKuISl0RSA1VA48iQpmAXnmtYc9hQ5WAy2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 01:56:46', 369393),
(11, 'Faiq', 'user', NULL, NULL, NULL, 'faiq@gmail.com', NULL, NULL, '$2b$10$31TghKofMYBHEM4cHHLy3uU5oEZXE2.NvCwKGdOP9nWtAQzy5XYx2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 02:08:48', 609011),
(12, 'Hassan', 'user', NULL, NULL, NULL, 'hassan@gmail.com', NULL, NULL, '$2b$10$3RZK/EGB/7XLBSYIBcSD6Og1fKRmx2rRNXE7/.lpF0L.EDJCqCgT6', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 02:11:13', 829177),
(13, 'Asia', 'user', NULL, NULL, NULL, 'asiaa@gmail.com', NULL, NULL, '$2b$10$P5Hf2yJlNZn./YBTane9weeiv9LxfJYBqo9WSfF5CQJpP7jcPiqDy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 02:16:50', 654463),
(14, 'Raina', 'user', NULL, NULL, NULL, 'rainaa@gmail.com', NULL, NULL, '$2b$10$6nu.9jZPw32k5WfFUw/FPeoGekZnbVNwakz87L9Vk8yHyW8uk36jy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 02:26:22', 910387),
(15, 'Raina', 'user', NULL, NULL, NULL, 'rainaaa@gmail.com', NULL, NULL, '$2b$10$PZTTnEBZovXQHrXOC0qPweJbFjTTeMsc3VXxiqwfMy5kepMXk9.fi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 02:31:34', 880206),
(16, 'Hassan', 'user', NULL, NULL, NULL, 'john@gmail.com', NULL, NULL, '$2b$10$f.vCWXnzXHnUMMe/9A2qP.sAq7KefuIYDsghDO5L88N0xkk9qgv3u', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 02:35:46', 890604),
(17, 'Hassan', 'user', NULL, NULL, NULL, 'johnn@gmail.com', NULL, NULL, '$2b$10$b7ug9qofD6kMR6ywwrGVYOCqjDNGIFjtXwfmnHNz5aKSix0Nc/6QW', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 02:37:11', 152771),
(18, 'Asifa', 'user', NULL, NULL, NULL, 'asifaaaaa@gmail.com', NULL, NULL, '$2b$10$8e.guqOSnp.qQPVX.s3cT.gvsY3ekc9RsSOAqDasjikYGopD/3Zo6', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 07:15:25', 910277),
(19, 'Asifa', 'user', NULL, NULL, NULL, 'asifaaaaaaa@gmail.com', NULL, NULL, '$2b$10$xE7QlJ6ojZGzmis.47Q7q.xfswirhKGaBcGZk3c8a3OrKauDMB5RS', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 07:15:56', 305300),
(20, 'Asifa', 'user', NULL, NULL, NULL, 'abidaaaaaaa@gmail.com', NULL, NULL, '$2b$10$mQzZCVzOItZeDXQIRxWydeXTs.s4iGSFn8Wea7Db6oBfGek7RURWq', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 07:20:12', 532099),
(21, 'Asifa', 'user', NULL, NULL, NULL, 'ayannnn@gmail.com', NULL, NULL, '$2b$10$uKvS3cCHhiA/wjZZgWUS3e7r2HaNOqT2CzUlh.kQJvKUEacn8dixS', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 07:21:47', 202021),
(22, 'Asifa', 'user', NULL, NULL, NULL, 'ayannnnn@gmail.com', NULL, NULL, '$2b$10$9wOadPyAwkKkxfPwxBBfpe.f8xVkGCPEqUt9K//07I7PS1ltVMntm', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 07:23:17', 104992),
(23, 'Asifa', 'user', NULL, NULL, NULL, 'ayannnnnm@gmail.com', NULL, NULL, '$2b$10$LKx31tQfEYxJR2GEy5lL9erMnaK3qhzbDXjkoaMEvVbjJkTTJhQre', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 08:46:23', 913804),
(24, 'Asifa', 'user', NULL, NULL, NULL, 'ayannnnnmjh@gmail.com', NULL, NULL, '$2b$10$e4WOqMtC.mFOIGMNhrfJOeMHq54c1cfDBREtOlKgfaJVyUr38pYNe', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 08:50:01', 927594),
(25, 'Asifa', 'user', NULL, NULL, NULL, 'ayanjhnnnnmjh@gmail.com', NULL, NULL, '$2b$10$1sTPjtf.Anlfj/SyK5hj1uxrMKcLl5WawcQXOesSFSOMh2VqHgE5a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 08:52:29', 735713),
(26, 'Asifa', 'user', NULL, NULL, NULL, 'ayanjhnnnnmdfjh@gmail.com', NULL, NULL, '$2b$10$EAF94SVWZevRHXCctm1JR.ETwT9/Srm1/QB2aG0/G1gcFbv6WTOwy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 08:53:52', 924602),
(27, 'Asifa', 'user', NULL, NULL, NULL, 'ayanjhnnnnmdfjffh@gmail.com', NULL, NULL, '$2b$10$8CcUpg7/VJcNQK.u6P01M.z2Yql6b8WHEP.iC9RGtvM3/hFv5lwPq', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 08:59:06', 116836),
(28, 'Asifa', 'user', NULL, NULL, NULL, 'ayanjjjdfjffh@gmail.com', NULL, NULL, '$2b$10$xB/Aztb6X6xMa7lhP5pmNeLgfU9449fAlkGQZVfegnVPC4ZENq/7C', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 09:02:14', 304739),
(29, 'Asifa', 'user', NULL, NULL, NULL, 'ayanjjjdfjffsh@gmail.com', NULL, NULL, '$2b$10$a7mxh.hzWp/.gGO74V6hHu4fbfAfIO3KJ13uJAfG4yMPzqkxSmFna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 09:06:02', 486119),
(30, 'Abida', 'user', NULL, NULL, NULL, 'zia@gmail.com', NULL, NULL, '$2b$10$hP4F5uwFBuYjqVwRBnible1YzAn7cEUX9np99oA8GgGH4EVjLL4pe', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 09:14:24', 516045),
(31, 'Hassan', 'user', NULL, NULL, NULL, 'ziaa@gmail.com', NULL, NULL, '$2b$10$2hUJZAxzpvd9DljeVdGjX.4lcDniGkzczUkjkSMX6.PYWf.xDyhsy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 09:19:01', 731951),
(32, 'Abida', 'user', NULL, NULL, NULL, 'ziaaa@gmail.com', NULL, NULL, '$2b$10$a320VxjljTvuMQU3DFO5E.INvblpAsrpOK.ewfU1KSYXqET6ge3R.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 09:24:02', 473542),
(33, 'Hassan', 'user', NULL, NULL, NULL, 'ziaaaaa@gmail.com', NULL, NULL, '$2b$10$7pkjVLcuFCEwMhQU8ziPsukurQ5I4YjzjPyvmJi/4jgicVzsu4.Uq', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, '2024-11-17 09:27:27', 243588);

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `created_date` timestamp(6) NULL DEFAULT current_timestamp(6),
  `status` tinyint(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `name`, `email`, `phone_number`, `subject`, `message`, `created_date`, `status`) VALUES
(3, 'Zain', 'zain@gmail.com', '5345345345', 'fsdferr4r4wr', 'dwefwer3r', '2024-10-24 08:08:23.070000', 1);

-- --------------------------------------------------------

--
-- Table structure for table `multi_text`
--

CREATE TABLE `multi_text` (
  `id` int(11) NOT NULL,
  `key` varchar(255) DEFAULT NULL,
  `text` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `multi_text`
--

INSERT INTO `multi_text` (`id`, `key`, `text`) VALUES
(1, 'home', 'DIGITAL SOLUTION'),
(2, 'home', 'Valid driving license'),
(3, 'home', 'Reliable transportation'),
(4, 'home', 'Smartphone with internet access'),
(5, 'home', 'Good knowledge of local roads'),
(6, 'home', 'Safety practices'),
(7, 'home', 'Valid driving license'),
(8, 'home', 'Reliable transportation'),
(9, 'home', 'Smartphone with internet access'),
(10, 'home', 'Good knowledge of local roads'),
(11, 'home', 'Safety practices'),
(12, 'home', 'Valid driving license'),
(13, 'home', 'Reliable transportation'),
(14, 'home', 'Smartphone with internet access'),
(15, 'home', 'Good knowledge of local roads'),
(16, 'home', 'Safety practices'),
(17, 'home', 'Valid driving license'),
(18, 'home', 'Reliable transportation'),
(19, 'home', 'Smartphone with internet access'),
(20, 'home', 'Good knowledge of local roads'),
(21, 'home', 'Safety practices'),
(22, 'home', 'Valid driving license'),
(23, 'home', 'Reliable transportation'),
(24, 'home', 'Smartphone with internet access'),
(25, 'home', 'Good knowledge of local roads'),
(26, 'home', 'Safety practices'),
(27, 'home', 'Valid driving license'),
(28, 'home', 'Reliable transportation'),
(29, 'home', 'Smartphone with internet access'),
(30, 'home', 'Good knowledge of local roads'),
(31, 'home', 'Safety practices'),
(32, 'home', 'Valid driving license'),
(33, 'home', 'Reliable transportation'),
(34, 'home', 'Smartphone with internet access'),
(35, 'home', 'Good knowledge of local roads'),
(36, 'home', 'Safety practices'),
(37, 'home', 'Valid driving license'),
(38, 'home', 'Reliable transportation'),
(39, 'home', 'Smartphone with internet access'),
(40, 'home', 'Good knowledge of local roads'),
(41, 'home', 'Safety practices'),
(42, 'home', 'Valid driving license'),
(43, 'home', 'Reliable transportation'),
(44, 'home', 'Smartphone with internet access'),
(45, 'home', 'Good knowledge of local roads'),
(46, 'home', 'Safety practices');

-- --------------------------------------------------------

--
-- Table structure for table `pages`
--

CREATE TABLE `pages` (
  `id` int(255) NOT NULL,
  `key` varchar(255) DEFAULT NULL,
  `content` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pages`
--

INSERT INTO `pages` (`id`, `key`, `content`) VALUES
(1, 'home', '{\"page_title\":\"Subscription\",\"meta_title\":\"Subscription\",\"meta_desc\":\"Subscription\",\"meta_keywords\":\"Subscription\",\"description1\":\"<p><strong>We are a UK based top Movers company</strong></p>\\r\\n\\r\\n<p>Moving services can significantly reduce the stress of relocating, allowing you to focus on setting into your new home.</p>\\r\\n\",\"sec1_number_0\":\"543\",\"sec1_heading_0\":\"Consulting Success\",\"sec1_number_1\":\"612\",\"sec1_heading_1\":\"Financial Consulting\",\"sec1_number_2\":\"356\",\"sec1_heading_2\":\"Market Research\",\"sec1_number_3\":\"287\",\"sec1_heading_3\":\"Happy Client\",\"image1\":\"/1730448329341-850066758.png\",\"sec1_image_0\":\"/1730450670169-463766425.png\",\"sec1_image_1\":\"/1730450670169-204203586.png\",\"sec1_image_2\":\"/1730450670170-364127055.png\",\"sec1_image_3\":\"/1730450670171-733055571.png\",\"description2\":\"<p><strong>OUR COMPANY</strong></p>\\r\\n\\r\\n<p><strong>We are experienced work lovers focussed on quality</strong></p>\\r\\n\",\"sec2_text_0\":\"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do\",\"sec2_heading_0\":\"Corporate Location\",\"sec2_text_1\":\"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do\",\"sec2_heading_1\":\"Door to Door Service\",\"sec2_text_2\":\"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do\",\"sec2_heading_2\":\"Warehousing &amp; Storage\",\"sec2_text_3\":\"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do\",\"sec2_heading_3\":\"Transportation Service\",\"sec2_image_0\":\"/1730450766797-64108129.png\",\"sec2_image_1\":\"/1730450766798-29376825.png\",\"sec2_image_2\":\"/1730450766801-779969670.png\",\"sec2_image_3\":\"/1730450766802-466338243.png\",\"description3\":\"<p><strong>ABOUT US </strong></p>\\r\\n\\r\\n<p><strong>Welcome Worldwide Best Transport Company</strong></p>\\r\\n\\r\\n<p>Competently implement efficient e-commerce without cross-unit growth strategies. Unlimited Revisions</p>\\r\\n\\r\\n<p>Best Solutions</p>\\r\\n\\r\\n<p>Best Fitness Excercise</p>\\r\\n\\r\\n<p>Combine Fitness and &nbsp;</p>\\r\\n\",\"link_text1\":\"About More\",\"link_url1\":\"/about\",\"image10\":\"/1730448445211-372554912.png\",\"video\":\"/1729847792254-292081144.mp4\",\"description4\":\"<p><strong>Fast And Reliable Moving Solutions Managers Since 1989</strong></p>\\r\\n\",\"image11\":\"/1731071513184-894207635.png\",\"description5\":\"<p><strong>why people choose us?</strong></p>\\r\\n\\r\\n<p><strong>We have 25+ years of experiences give you better results.</strong> &nbsp;</p>\\r\\n\",\"link_text2\":\"Read More\",\"link_url2\":\"/read\",\"sec5_text_0\":\"Lorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\\r\\nLorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\",\"sec5_heading_0\":\"Economical Air Freight\",\"sec5_text_1\":\"Lorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\\r\\nLorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\",\"sec5_heading_1\":\"Time Bound deliveries\",\"sec5_text_2\":\"Lorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\\r\\nLorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\",\"sec5_heading_2\":\"Same day Delivery\",\"sec5_text_3\":\"Lorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\\r\\nLorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\",\"sec5_heading_3\":\"Multi-modal Transport\",\"sec5_image_0\":\"/1730450902375-963025364.png\",\"sec5_image_1\":\"/1730450902376-972173986.png\",\"sec5_image_2\":\"/1730450902376-578491998.png\",\"sec5_image_3\":\"/1730450902376-279506823.png\",\"sec6_text_0\":\"Lorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\\r\\nLorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\",\"sec6_heading_0\":\"Free Estimate\",\"sec6_text_1\":\"Lorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\\r\\nLorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\",\"sec6_heading_1\":\"Packaging\",\"sec6_text_2\":\"Lorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\\r\\nLorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\",\"sec6_heading_2\":\"Moving Protection\",\"sec6_text_3\":\"Lorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\\r\\nLorem ipsum dolor sit amet,con sec tetur adipisicing elit,sed do.\",\"sec6_heading_3\":\"Contact Office\",\"sec6_image_0\":\"/1730451094134-288079691.png\",\"sec6_image_1\":\"/1730451094134-330399913.png\",\"sec6_image_2\":\"/1730451094134-442063859.png\",\"sec6_image_3\":\"/1730451094135-738193941.png\",\"description6\":\"<p><strong>How It Works? </strong></p>\\r\\n\\r\\n<p><strong>How We Deliver Your Parcel</strong></p>\\r\\n\",\"sec7_text_0\":\"One of the key components of best logistics solutions industy\",\"sec7_heading_0\":\"Parcel Register\",\"sec7_text_1\":\"One of the key components of best logistics solutions industy\",\"sec7_heading_1\":\"Parcel Loading\",\"sec7_text_2\":\"One of the key components of best logistics solutions industy\",\"sec7_heading_2\":\"Parcel In-transit\",\"sec7_text_3\":\"One of the key components of best logistics solutions industy\",\"sec7_heading_3\":\"Parcel Delivery\",\"sec7_image_0\":\"/1730451232294-686095641.png\",\"sec7_image_1\":\"/1730451232294-336430463.png\",\"sec7_image_2\":\"/1730451232294-604069875.png\",\"sec7_image_3\":\"/1730451232294-633306197.png\",\"image20\":\"/1730448567921-578719029.png\",\"description7\":\"<p><strong>TESTIMONIALS </strong></p>\\r\\n\\r\\n<p><strong>What Our Clients Say</strong></p>\\r\\n\\r\\n<p>Meet the agents who will assist you&nbsp;</p>\\r\\n\"}'),
(2, 'about', '{\"page_title\":\"About\",\"meta_title\":\"About\",\"meta_desc\":\"About\",\"meta_keywords\":\"About\",\"description1\":\"<p><strong>Who we are</strong></p>\\r\\n\\r\\n<p><strong>Digital &amp;&nbsp;Trusted&nbsp;Transport Logistics Company</strong></p>\\r\\n\\r\\n<p>Nulla vitae ex nunc Morbi quis purus convallis fermentum metus volutpat sodales purus Nunc quis mauris et eros vulputate mattis Nulla vitae ex nunc Mor bi quis the purus convallis fermentum metus volutpat &nbsp;</p>\\r\\n\",\"link_text1\":\"About More\",\"link_url1\":\"/about\",\"abt_image1\":\"/1730451432275-787410133.png\",\"description2\":\"<p><strong>We give you complete control of your any type shipment.</strong></p>\\r\\n\\r\\n<p>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution. &nbsp;</p>\\r\\n\",\"text\":\"We Create A Honest, Hassle-Free And Quality Moving Experience\",\"abt_image2\":\"/1730451512621-153824523.png\",\"abt_image3\":\"/1730451512621-574064704.png\",\"description3\":\"<p><strong>Professionals</strong></p>\\r\\n\\r\\n<p><strong>Our Expert Teams</strong></p>\\r\\n\\r\\n<p>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. &nbsp;</p>\\r\\n\",\"description4\":\"<p><strong>Fast And Reliable Moving Solutions Managers Since 1989</strong></p>\\r\\n\",\"sec4_number_0\":\"10K\",\"sec4_heading_0\":\"Projects Completed\",\"sec4_number_1\":\"240+\",\"sec4_heading_1\":\"Projects Completed\",\"sec4_number_2\":\"8K\",\"sec4_heading_2\":\"Projects Completed\",\"sec4_number_3\":\"80+\",\"sec4_heading_3\":\"Projects Completed\",\"abt_video\":\"/1729856781706-27457260.mp4\",\"abt_image5\":\"/1730451859259-582992788.png\",\"sec4_abt_image_0\":\"/1730451859267-121235552.png\",\"sec4_abt_image_1\":\"/1730451859268-480020516.png\",\"sec4_abt_image_2\":\"/1730451859268-449441563.png\",\"abt_image4\":\"/1730451606354-406226733.png\",\"sec4_abt_image_3\":\"/1730451859268-961650252.png\",\"description5\":\"<p><span style=\\\"color:#ff0000\\\"><strong>Who we are </strong></span></p>\\r\\n\\r\\n<p><strong>Benefits for using our services</strong></p>\\r\\n\\r\\n<ul>\\r\\n\\t<li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt.</li>\\r\\n\\t<li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt.</li>\\r\\n\\t<li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt.</li>\\r\\n</ul>\\r\\n\\r\\n<p>testing &nbsp;</p>\\r\\n\",\"link_text2\":\"About More\",\"link_url2\":\"/about more\",\"abt_image10\":\"/1730451859268-882029342.png\"}'),
(3, 'contact', '{\"page_title\":\"Contact Us\",\"meta_title\":\"Contact Us\",\"meta_desc\":\"Contact Us\",\"meta_keywords\":\"Contact Us\",\"description1\":\"<p><strong>CONTACT</strong></p>\\r\\n\\r\\n<p><strong>Who we are</strong></p>\\r\\n\\r\\n<p><strong>Let&rsquo;s Start a Conversation</strong> &nbsp;</p>\\r\\n\",\"description2\":\"<p><strong>Ask How can We Help You</strong></p>\\r\\n\\r\\n<p><strong>Seek our platform in action</strong> Our company provides a full range of services for the construction of private houses and cottages since 199</p>\\r\\n\\r\\n<p><strong>Seek our platform in action</strong> Our company provides a full range of services for the construction of private houses and cottages since 199</p>\\r\\n\\r\\n<p><strong>Seek our platform in action</strong> Our company provides a full range of services for the construction of private houses and cottages since 199 &nbsp;</p>\\r\\n\",\"sec1_heading_0\":\"Address\",\"sec1_heading_1\":\"Email\",\"sec1_heading_2\":\"Phone\",\"heading1\":\"Let\'s Start\"}'),
(4, 'privacy-policy', '{\"page_title\":\"Privacy Policy\",\"meta_title\":\"Privacy Policy\",\"meta_desc\":\"Privacy Policy\",\"meta_keywords\":\"Privacy Policy\",\"heading1\":\"Our Policies\",\"heading2\":\"Privacy Policy\",\"description1\":\"<p>Welcome to fastuk! We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website FastUk.com, use our platform, or engage with our services. By using our platform, you agree to the collection and use of information in accordance with this policy.</p>\\r\\n\\r\\n<p><strong>Information We Collect</strong></p>\\r\\n\\r\\n<p><strong>Personal Information</strong></p>\\r\\n\\r\\n<p>We collect personal information that you provide to us directly, such as when you create an account, update your profile, or contact us. This information may include: Name Email address Phone number Address Payment information Profile information, including photos and biographies for agents</p>\\r\\n\\r\\n<p><strong>Non-Personal Information</strong></p>\\r\\n\\r\\n<p>We also collect non-personal information automatically when you use our platform. This may include: IP address Browser type Device information Usage data (e.g., pages visited, time spent on the site)</p>\\r\\n\\r\\n<p><strong>How We Use Your Information</strong></p>\\r\\n\\r\\n<p>We use the information we collect for various purposes, including: To provide and maintain our services To process transactions and send you related information To personalize your experience on our platform To improve our website and services To communicate with you, including responding to your comments, questions, and requests To send you promotional materials and other communications To detect, prevent, and address technical issues and security concerns</p>\\r\\n\\r\\n<p><strong>Cookies and Tracking Technologies</strong>&nbsp;</p>\\r\\n\\r\\n<p>Our platform uses cookies and similar tracking technologies to enhance your experience. Cookies are small data files stored on your device. We use cookies to: Remember your login details Understand how you use our platform Personalize content and advertisements Improve our services You can choose to disable cookies through your browser settings, but this may affect your ability to use certain features of our platform.</p>\\r\\n\\r\\n<p><strong>Sharing Your Information</strong></p>\\r\\n\\r\\n<p>We do not sell, trade, or otherwise transfer your personal information to outside parties without your consent, except in the following circumstances: To trusted third-party service providers who assist us in operating our platform, conducting our business, or providing services to you To comply with legal obligations, such as responding to a subpoena or similar legal process To protect and defend our rights or property In connection with a merger, acquisition, or sale of all or a portion of our assets</p>\\r\\n\\r\\n<p><strong>Data Security</strong></p>\\r\\n\\r\\n<p>We implement a variety of security measures to maintain the safety of your personal information. These measures include: Using SSL encryption for sensitive data Restricting access to personal information to authorized personnel only Regularly updating our security practices to protect against unauthorized access</p>\\r\\n\\r\\n<p><strong>Changes to This Privacy Policy</strong></p>\\r\\n\\r\\n<p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>\\r\\n\\r\\n<p><strong>Contact Information</strong></p>\\r\\n\\r\\n<p>If you have any questions or concerns about this Privacy Policy, please contact us at:  Phone: (123) 456-7890</p>\\r\\n\"}'),
(5, 'terms-conditions', '{\"page_title\":\"Terms & Conditions\",\"meta_title\":\"Terms & Conditions\",\"meta_desc\":\"Terms & Conditions\",\"meta_keywords\":\"Terms & Conditions\",\"heading1\":\"OUR TERMS\",\"heading2\":\"Terms & Condition\",\"description1\":\"<p>Welcome to veerra! We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website FastUk .com, use our platform, or engage with our services. By using our platform, you agree to the collection and use of information in accordance with this policy.</p>\\r\\n\\r\\n<p><strong>Information We Collect</strong></p>\\r\\n\\r\\n<p><strong>Personal Information</strong></p>\\r\\n\\r\\n<p>We collect personal information that you provide to us directly, such as when you create an account, update your profile, or contact us. This information may include: Name Email address Phone number Address Payment information Profile information, including photos and biographies for agents</p>\\r\\n\\r\\n<p><strong>Non-Personal Information</strong></p>\\r\\n\\r\\n<p>We also collect non-personal information automatically when you use our platform. This may include: IP address Browser type Device information Usage data (e.g., pages visited, time spent on the site)</p>\\r\\n\\r\\n<p><strong>How We Use Your Information</strong></p>\\r\\n\\r\\n<p>We use the information we collect for various purposes, including: To provide and maintain our services To process transactions and send you related information To personalize your experience on our platform To improve our website and services To communicate with you, including responding to your comments, questions, and requests To send you promotional materials and other communications To detect, prevent, and address technical issues and security concerns</p>\\r\\n\\r\\n<p><strong>Changes to This Privacy Policy</strong></p>\\r\\n\\r\\n<p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>\\r\\n\\r\\n<p><strong>Contact Information</strong></p>\\r\\n\\r\\n<p>If you have any questions or concerns about this Privacy Policy, please contact us at:  Phone: (123) 456-7890</p>\\r\\n\"}'),
(6, 'help-support', '{\"page_title\":\"Help & Support\",\"meta_title\":\"Help & Support\",\"meta_desc\":\"Help & Support\",\"meta_keywords\":\"Help & Support\",\"heading1\":\"SUPPORT SYSTEM\",\"heading2\":\"Help & Support\",\"description1\":\"<p>Welcome to veerra! We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website FastUk.com, use our platform, or engage with our services. By using our platform, you agree to the collection and use of information in accordance with this policy.</p>\\r\\n\\r\\n<p><strong>Information We Collect</strong></p>\\r\\n\\r\\n<p><strong>Personal Information</strong></p>\\r\\n\\r\\n<p>We collect personal information that you provide to us directly, such as when you create an account, update your profile, or contact us. This information may include: Name Email address Phone number Address Payment information Profile information, including photos and biographies for agents</p>\\r\\n\\r\\n<p><strong>Non-Personal Information</strong></p>\\r\\n\\r\\n<p>We also collect non-personal information automatically when you use our platform. This may include: IP address Browser type Device information Usage data (e.g., pages visited, time spent on the site)</p>\\r\\n\\r\\n<p><strong>How We Use Your Information</strong></p>\\r\\n\\r\\n<p>We use the information we collect for various purposes, including: To provide and maintain our services To process transactions and send you related information To personalize your experience on our platform To improve our website and services To communicate with you, including responding to your comments, questions, and requests To send you promotional materials and other communications To detect, prevent, and address technical issues and security concerns</p>\\r\\n\\r\\n<p><strong>Changes to This Privacy Policy</strong></p>\\r\\n\\r\\n<p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>\\r\\n\\r\\n<p><strong>Contact Information</strong></p>\\r\\n\\r\\n<p>If you have any questions or concerns about this Privacy Policy, please contact us at:  Phone: (123) 456-7890</p>\\r\\n\"}'),
(7, 'faq', '{\"page_title\":\"Faq\",\"meta_title\":\"Faq\",\"meta_desc\":\"Faq\",\"meta_keywords\":\"Faq\",\"description1\":\"<p><strong>FAQ\'s</strong></p>\\r\\n\\r\\n<p><strong>Frequently Asked Question</strong></p>\"}'),
(8, 'login', '{\"page_title\":\"Login\",\"meta_title\":\"Login\",\"meta_desc\":\"          Login  \",\"meta_keywords\":\"          Login  \",\"description1\":\"<p><strong>Welcome back!</strong><br />\\r\\nLet&#39;s get you some health tips today.<br />\\r\\n&nbsp;</p>\\r\\n\"}'),
(9, 'forgot-password', '{\"page_title\":\"Forgot Password\",\"meta_title\":\"Forgot Password\",\"meta_desc\":\"Forgot Password\",\"meta_keywords\":\"Forgot Password  \",\"description1\":\"<p><strong>Forgot Password?</strong><br />\\r\\nEnter your email address associated with your account<br />\\r\\n&nbsp;</p>\\r\\n\"}'),
(10, 'sign-up', '{\"page_title\":\"Sign up\",\"meta_title\":\"Sign up\",\"meta_desc\":\"Sign up          \",\"meta_keywords\":\"Sign up          \",\"description1\":\"<p><strong>Join us today</strong><br />\\r\\nLet&#39;s get started today.</p>\\r\\n\"}'),
(11, 'reset-password', '{\"page_title\":\"Reset Password\",\"meta_title\":\"Reset Password\",\"meta_desc\":\"Reset Password            \",\"meta_keywords\":\"Reset Password            \",\"description1\":\"<p><strong>Reset your Password&nbsp;</strong><br />\\r\\n&nbsp;</p>\\r\\n\"}'),
(12, 'business', '{\"page_title\":\"Business\",\"meta_title\":\"Business\",\"meta_desc\":\"Business\",\"meta_keywords\":\"Business\",\"description1\":\"<p><strong>For Businesses<br />\\r\\nBusiness Solutions - Delivering Excellence for Your Business</strong><br />\\r\\nWe understand that every business is unique. That&rsquo;s why we offer customized shipping solutions to meet your specific needs, whether you&rsquo;re a small startup or a large enterprise. From bulk deliveries to urgent express services, we have the right plan for your business.<br />\\r\\n&nbsp;</p>\\r\\n\",\"link_text1\":\"Get a Quote\",\"link_url1\":\"/quote\",\"business_image1\":\"/1730727652508-484900474.png\",\"heading1\":\"PROCESS\",\"heading2\":\"Our Process\",\"link_text2\":\"Request a Consultation\",\"link_url2\":\"/request\",\"sec1_text_0\":\"Count on us for fast and dependable delivery services. We ensure your packages reach their destination safely.\",\"sec1_heading_0\":\"Speed & Reliability\",\"sec1_text_1\":\"Our business solutions come with competitive rates and no hidden fees.\",\"sec1_heading_1\":\"Competitive Pricing\",\"sec1_text_2\":\"We prioritize the safety of your goods, with secure packaging solutions.\",\"sec1_heading_2\":\"Secure & Safe Handling\",\"sec1_text_3\":\"Expand your business without boundaries\",\"sec1_heading_3\":\"Global Research\",\"sec1_business_image_0\":\"/1730727652516-530584361.png\",\"sec1_business_image_1\":\"/1730727652516-577720571.png\",\"sec1_business_image_2\":\"/1730727652517-708724335.png\",\"sec1_business_image_3\":\"/1730727652517-884721132.png\",\"description2\":\"<p><strong>PARTNERS<br />\\r\\nExclusive Discounts &amp; Rewards</strong><br />\\r\\nPartner with us and enjoy exclusive discounts on bulk shipments, subscription plans, and seasonal offers. We reward your loyalty with benefits designed to save you time and money, so you can focus on what matters most&mdash;growing your business.</p>\\r\\n\",\"link_text3\":\"Get a Quote\",\"link_url3\":\"/quote\",\"business_image6\":\"/1730727652518-684549090.png\",\"description3\":\"<p><strong>OPERATIONS<br />\\r\\nSeamless Integration with Your Business Operations</strong><br />\\r\\n<br />\\r\\n<br />\\r\\n<br />\\r\\n<br />\\r\\n&nbsp;</p>\\r\\n\",\"sec3_text_0\":\"<p><strong>API &amp; E-Commerce Integration</strong><br />\\r\\nEasily connect your online store or business management software with our platform through our API. Automate order processing and shipping labels directly from your system.</p>\\r\\n\",\"sec3_text_1\":\"<p><strong>Automated Shipping &amp; Label Generation</strong><br />\\r\\nWith our integration, you can automate the creation of shipping labels and invoices as soon as an order is placed.</p>\\r\\n\",\"sec3_text_2\":\"<p><strong>Inventory &amp; Order Management Synchronization</strong><br />\\r\\nKeep your inventory and order statuses up to date with real-time synchronization.<br />\\r\\n&nbsp;</p>\\r\\n\",\"sec3_text_3\":\"<p><strong>Customizable Shipping Rules &amp; Settings</strong><br />\\r\\nTailor your shipping preferences to match your business needs. Set custom rules based on order value, weight, or delivery location.</p>\\r\\n\",\"sec3_business_image_0\":\"/1730727652529-11052765.png\",\"sec3_business_image_1\":\"/1730727652530-919293913.png\",\"sec3_business_image_2\":\"/1730727652536-590437590.png\",\"sec3_business_image_3\":\"/1730727652536-855943281.png\",\"description8\":\"<p><strong>TRACKING<br />\\r\\nReal-Time Tracking &amp; Transparency</strong><br />\\r\\nStay in control of your shipments with our advanced tracking system. Our platform provides real-time updates and full transparency, allowing you and your customers to track packages every step of the way.<br />\\r\\n&nbsp;</p>\\r\\n\",\"link_text4\":\"About More\",\"link_url4\":\"/about\",\"business_image11\":\"/1730727652541-721234912.png\"}'),
(13, 'rider', '{\"page_title\":\"Rider\",\"meta_title\":\"Rider\",\"meta_desc\":\"Rider\",\"meta_keywords\":\"Rider\",\"description1\":\"<p><strong>Become a Rider<br />\\r\\nWhy Ride with Us?</strong><br />\\r\\nDiscover the freedom and benefits of joining our rider community. Enjoy flexible schedules, competitive pay, and the opportunity to explore your city while delivering packages. Whether you&rsquo;re looking for full-time work or a way to earn extra income in your spare time, we have a place for you.<br />\\r\\n&nbsp;</p>\\r\\n\",\"link_text1\":\"Get a Quote\",\"link_url1\":\"/quote\",\"rider_image1\":\"/1730728686830-95236240.png\",\"description2\":\"<p><strong>CHOOSE</strong></p>\\r\\n\\r\\n<p><strong>Rider Requirements</strong><br />\\r\\nTo join our team, make sure you meet these basic requirements<br />\\r\\n&nbsp;</p>\\r\\n\",\"sec_text\":[\"Valid driving license\",\"Reliable transportation\",\"Smartphone with internet access\",\"Good knowledge of local roads\",\"Safety practices\"],\"description3\":\"<p><strong>WORK</strong><br />\\r\\n<strong>Flexible Work Schedule</strong><br />\\r\\nWe know life can be busy, so we give you the flexibility to set your own hours. Choose when you want to work&mdash;day, evening, or weekend shifts&mdash;so you can balance your deliveries with your personal life and other commitments.<br />\\r\\n&nbsp;</p>\\r\\n\\r\\n<p>&nbsp;</p>\\r\\n\",\"link_text2\":\"Get a Quote\",\"link_url2\":\"/quote\",\"rider_image2\":\"/1730728686837-715153109.png\",\"description4\":\"<p><strong>Rider Perks &amp; Benefits</strong><br />\\r\\nWe believe in taking care of our riders, which is why we offer exclusive benefits<br />\\r\\n<br />\\r\\n<br />\\r\\n<br />\\r\\n&nbsp;</p>\\r\\n\",\"sec3_text_0\":\"Discounts on fuel and vehicle maintenance.\",\"sec3_text_1\":\"Access to affordable insurance options and safety gear\",\"sec3_text_2\":\"Special rewards programs for consistent performance\",\"sec3_text_3\":\"Opportunity to grow within our company\",\"sec3_rider_image_0\":\"/1730728686839-984463850.png\",\"sec3_rider_image_1\":\"/1730728686839-450821426.png\",\"sec3_rider_image_2\":\"/1730728686839-458236692.png\",\"sec3_rider_image_3\":\"/1730114046826-247746083.jpg\",\"description5\":\"<p><strong>WHY FastUK</strong></p>\\r\\n\\r\\n<p><strong>Our Riders Safety First</strong><br />\\r\\n<br />\\r\\n<br />\\r\\n<br />\\r\\n&nbsp;</p>\\r\\n\",\"sec4_text_0\":\"Emphasize Expertise\",\"sec4_text_1\":\"Stress-Free Experience\",\"sec4_text_2\":\"Personalized Solutions\",\"sec4_text_3\":\"Unbeatable Value \",\"sec4_rider_image_0\":\"/1730728686840-611564274.png\",\"sec4_rider_image_1\":\"/1730728686840-250091285.png\",\"sec4_rider_image_2\":\"/1730728686840-863920928.png\",\"sec4_rider_image_3\":\"/1730728686840-669185425.png\"}');

-- --------------------------------------------------------

--
-- Table structure for table `remote_post_codes`
--

CREATE TABLE `remote_post_codes` (
  `id` int(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `remote_post_codes`
--

INSERT INTO `remote_post_codes` (`id`, `title`, `status`) VALUES
(2, 'kj', 1);

-- --------------------------------------------------------

--
-- Table structure for table `request_parcels`
--

CREATE TABLE `request_parcels` (
  `id` int(255) NOT NULL,
  `parcel_number` varchar(255) DEFAULT NULL,
  `parcel_type` varchar(255) DEFAULT NULL,
  `length` varchar(255) DEFAULT NULL,
  `width` varchar(255) DEFAULT NULL,
  `height` varchar(255) DEFAULT NULL,
  `source` varchar(255) DEFAULT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `distance` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `request_quote`
--

CREATE TABLE `request_quote` (
  `id` int(255) NOT NULL,
  `user_id` int(255) DEFAULT NULL,
  `selected_vehicle` int(255) DEFAULT NULL,
  `vehicle_price` varchar(255) DEFAULT NULL,
  `total_amount` varchar(255) DEFAULT NULL,
  `payment_intent` varchar(255) DEFAULT NULL,
  `customer_id` int(255) DEFAULT NULL,
  `source_postcode` varchar(255) DEFAULT NULL,
  `source_address` varchar(255) DEFAULT NULL,
  `source_name` varchar(255) DEFAULT NULL,
  `source_phone_number` varchar(255) DEFAULT NULL,
  `source_city` varchar(255) DEFAULT NULL,
  `dest_postcode` varchar(255) DEFAULT NULL,
  `dest_address` varchar(255) DEFAULT NULL,
  `dest_name` varchar(255) DEFAULT NULL,
  `dest_phone_number` varchar(255) DEFAULT NULL,
  `dest_city` varchar(255) DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `payment_method_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `riders`
--

CREATE TABLE `riders` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `dob` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `vehicle_owner` tinyint(255) DEFAULT NULL,
  `vehicle_type` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `rider_image` varchar(255) DEFAULT NULL,
  `created_date` varchar(255) DEFAULT current_timestamp(),
  `status` tinyint(255) DEFAULT NULL,
  `verified` tinyint(255) DEFAULT NULL,
  `otp` int(255) NOT NULL,
  `vehicle_registration_num` varchar(255) DEFAULT NULL,
  `driving_license_num` varchar(255) DEFAULT NULL,
  `driving_license` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `riders`
--

INSERT INTO `riders` (`id`, `full_name`, `first_name`, `last_name`, `email`, `password`, `phone_number`, `dob`, `address`, `city`, `vehicle_owner`, `vehicle_type`, `state`, `country`, `rider_image`, `created_date`, `status`, `verified`, `otp`, `vehicle_registration_num`, `driving_license_num`, `driving_license`) VALUES
(33, 'Anaya khalid', NULL, NULL, 'anaya@gmail.com', NULL, '+44 7123 456 789', '15-07-75', '59 Acorn Boulevard, Sheffield, S1 0 KK', 'Birmingham', 1, 'car', NULL, NULL, NULL, '2024-10-29 13:58:07.467', 0, 0, 885726, '5237878523789', '78247857893892', '1730195421268-116993285.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `service_image` varchar(255) DEFAULT NULL,
  `status` tinyint(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `title`, `description`, `service_image`, `status`) VALUES
(2, 'Corporate Location', '<p>lorem ipsum dolor sit amet, con sec tetur adipisicing elit, sed do. 11</p>\r\n', '1729236104664-703920761.jpg', 1),
(4, 'shoes', '<p>this is shoes products..</p>', '1730285634032-242744836.jpg', 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_admin`
--

CREATE TABLE `tbl_admin` (
  `id` int(255) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `site_domain` varchar(255) NOT NULL,
  `site_name` varchar(255) NOT NULL,
  `site_phone` varchar(255) NOT NULL,
  `site_email` varchar(255) NOT NULL,
  `receiving_site_email` varchar(255) NOT NULL,
  `site_noreply_email` varchar(255) NOT NULL,
  `site_address` varchar(255) NOT NULL,
  `footer_copyright` varchar(255) NOT NULL,
  `site_instagram` varchar(255) NOT NULL,
  `site_facebook` varchar(255) NOT NULL,
  `site_youtube` varchar(255) NOT NULL,
  `site_twitter` varchar(255) NOT NULL,
  `site_processing_fee` int(255) NOT NULL,
  `site_spotify` varchar(255) DEFAULT NULL,
  `site_etsy` varchar(255) DEFAULT NULL,
  `logo_image` varchar(255) DEFAULT NULL,
  `favicon_image` varchar(255) DEFAULT NULL,
  `thumb_image` varchar(255) DEFAULT NULL,
  `site_sandbox` tinyint(4) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_admin`
--

INSERT INTO `tbl_admin` (`id`, `user_name`, `password`, `site_domain`, `site_name`, `site_phone`, `site_email`, `receiving_site_email`, `site_noreply_email`, `site_address`, `footer_copyright`, `site_instagram`, `site_facebook`, `site_youtube`, `site_twitter`, `site_processing_fee`, `site_spotify`, `site_etsy`, `logo_image`, `favicon_image`, `thumb_image`, `site_sandbox`) VALUES
(1, 'admin', '$2b$10$IQM2Rggdci9pjbBm9zoRY.AdZ1QuV45MGj5IHBQq5hr/rAEAPV9s2', 'www.fastukcouriers.co.uk', 'Fast UK', '(540) 229-6647', 'info.fastuk@gmail.com', 'asifaa.rehman@gmail.com', 'noreply@herosolutions.com.pk', '401 New Mexico 195, Elephant Butte New York, 87935', 'All rights reserved.', 'instagram.com', 'facebook.com', 'youtube.com', 'twitter.com', 20, 'spotify.com', 'etsy.com', '1729671186053-53027456.png', '1730285707710-604130236.png', '1729671186054-282612478.png', 1);

-- --------------------------------------------------------

--
-- Table structure for table `team_members`
--

CREATE TABLE `team_members` (
  `id` int(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `status` tinyint(5) DEFAULT NULL,
  `team_mem_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `team_members`
--

INSERT INTO `team_members` (`id`, `title`, `designation`, `status`, `team_mem_image`) VALUES
(1, 'Harry Mok ', 'Main Supervisor', 1, '1730452346935-967717037.png'),
(8, 'firdous', 'manager', 1, '1730452368310-90717197.png');

-- --------------------------------------------------------

--
-- Table structure for table `testimonials`
--

CREATE TABLE `testimonials` (
  `id` int(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` tinyint(255) DEFAULT NULL,
  `testi_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `testimonials`
--

INSERT INTO `testimonials` (`id`, `title`, `designation`, `description`, `status`, `testi_image`) VALUES
(10, 'John Doe', 'worker', '<p>.. followed by some bogus content.<br />\r\nAenean commodo ligula egget dolor.<br />\r\nAenean massa. Cum sociis natoque<br />\r\npenatibus et magnis dis parturient<br />\r\nmontes, nascetur ridiculus mus.</p>\r\n', 1, '1730452999168-964665304.png'),
(14, 'Jack Albert', 'CEO SoftTechit', '<p>i just wanted to share a quick note and let you know that you guys do a really good job. i&#39;m glad i decided to work with you. it&#39;s really great how easy your websites are to update and manage. i never have any problem at all.</p>\r\n', 1, '1730453014656-15032635.png');

-- --------------------------------------------------------

--
-- Table structure for table `tokens`
--

CREATE TABLE `tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `token` text DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expiry_date` timestamp NULL DEFAULT NULL,
  `fingerprint` varchar(255) DEFAULT NULL,
  `user_type` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tokens`
--

INSERT INTO `tokens` (`id`, `user_id`, `token`, `type`, `created_at`, `expiry_date`, `fingerprint`, `user_type`) VALUES
(1, 8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwidHlwZSI6InJpZGVyIiwiaWF0IjoxNzI3ODU3NTIzLCJleHAiOjE3Mjc4NjExMjN9._CJlCw6vgRYTlHxLy2NDGKzsGWAr2w1QtZBZH5MCrnQ', 'rider', '2024-10-02 08:25:23', '2024-10-02 09:25:23', NULL, NULL),
(2, 9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwidHlwZSI6InJpZGVyIiwiaWF0IjoxNzI3ODU3NjI3LCJleHAiOjE3Mjc4NjEyMjd9.yOnDzm_AVT75PoGDjOd3P5cb8vRx-5cxSuzI8Ljm-g4', 'rider', '2024-10-02 08:27:07', '2024-10-02 09:27:07', NULL, NULL),
(3, 11, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsInR5cGUiOiJyaWRlciIsImlhdCI6MTcyNzg1ODUxNiwiZXhwIjoxNzI3ODYyMTE2fQ.6JT8vAJ0ZOwlRAHqLzPidFYEKcAW3iEBUMJakGR61TA', 'rider', '2024-10-02 08:41:56', '2024-10-02 09:41:56', NULL, NULL),
(4, 12, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsInR5cGUiOiJyaWRlciIsImlhdCI6MTcyNzg1ODU0MywiZXhwIjoxNzI3ODYyMTQzfQ.h0A3PDuYTVwO2KP_AlswHquHKgsrAKHJOuvvEd3_akA', 'rider', '2024-10-02 08:42:23', '2024-10-02 09:42:23', NULL, NULL),
(5, 14, '37231ce77d170c411a71a0d73b921bcbca9592222ae03ad3e6ff5ae378bdfd7a', 'rider', '2024-10-02 09:43:36', '2024-10-02 10:43:36', '::1-PostmanRuntime/7.42.0-+44 7123 456 789', NULL),
(6, 15, 'db2eb42c94eab77512f10a7f8c43fc0d7d93bf591bb85f2099d3888c7a2f1bd7', 'rider', '2024-10-02 09:53:46', '2024-10-02 10:53:46', NULL, NULL),
(7, 16, '87ca34fb4cce4e50055933fd2910e348ce22c1c136f7efef73ed00b40cd442ca', 'rider', '2024-10-02 10:25:48', '2024-10-02 11:25:48', NULL, NULL),
(8, 17, 'b5951e4fc6d88498e1782dc8f315dcadd6942940141d197f118ade7c69aa5b9e', 'rider', '2024-10-02 10:29:27', '2024-10-02 11:29:27', NULL, NULL),
(9, 20, '6b97567f5cb4c84b381f0271b91a763597596a2497b1f1d458a3eda45cf61d4a', 'rider', '2024-10-02 11:02:21', '2024-10-02 12:02:21', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(10, 20, 'ccb27440f72163c59f8763b7dc2341c87dc7d1d177adbe678c08d0f1a8866c0c', 'rider', '2024-10-02 11:25:22', '2024-10-02 12:25:22', NULL, NULL),
(11, 21, '9deba1c499cf5604fe2e43d47b99fa9c79ca89f3a6cd0d099c205cecdfff1183', 'rider', '2024-10-02 11:54:31', '2024-10-02 12:54:31', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(12, 20, '14b0d56f52561f316519a97968531002fc0957cc8c268db5e4d20faddcbf44ef', 'rider', '2024-10-03 07:10:22', '2024-10-03 08:10:22', NULL, NULL),
(14, 22, 'a66386fa3930ef5c76bdab692c332fcb0f1af504807c00e14514838763537d73', 'rider', '2024-10-03 07:34:57', '2024-10-03 08:34:57', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(15, 23, 'e685848adbc1123ccf113a812abc9366b06e78e32c42d402871d3a043f7f0c7f', 'rider', '2024-10-03 07:39:13', '2024-10-03 08:39:13', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(16, 24, '542cc5cfc44fb3e19cc843192141e02afb86c76e4d3ca316d592fbb7d362bf5a', 'rider', '2024-10-03 07:41:32', '2024-10-03 08:41:32', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(17, 25, '2d15871301e38533b54bc2a60a602ab3f66d018829f17e3ab0b0aae9861a2543', 'rider', '2024-10-03 07:52:44', '2024-10-03 08:52:44', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(18, 21, 'f969befbbf1394e288db4d1b9dfc6e0bd39096a0158302717ae8b861c255b3b9', 'rider', '2024-10-03 08:06:11', '2024-10-03 09:06:11', NULL, NULL),
(19, 26, '4fc302a2ad0e9e2332b9dc6d3da68a177eda1052da063878173bb81b880d6a32', 'rider', '2024-10-03 08:12:56', '2024-10-03 09:12:56', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(20, 27, '63ce387144684bf96cf0042ee0a271a1ba016f98f3c0b27989a4428984c17ecd', 'rider', '2024-10-03 08:57:48', '2024-10-03 09:57:48', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(21, 28, '875b25ecc6cac3a4cd666c53f3f64a4f03128af79015680a1e6e3599b55e0df4', 'rider', '2024-10-03 09:03:34', '2024-10-03 10:03:34', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(22, 24, 'ba217f4efddade919a6d3f1bd46ccc0c420072b20bd6044a02567ea228a86e85', 'rider', '2024-10-03 09:26:40', '2024-10-03 10:26:40', NULL, NULL),
(23, 29, 'ab881f3f3a09ffa312b25bfc72eb69a322c163ba02e39f56d7e529d16c61f98d', 'rider', '2024-10-10 13:35:59', '2024-10-10 14:35:59', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(24, 30, 'c48261c3cf3b7ba86b22786bcf0dd6f65bdcdf755a27c9dd8f74748ee6f98c29', 'rider', '2024-10-10 13:52:56', '2024-10-10 14:52:56', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(25, 1, '6b796f4ad423714c8c0580c27e5e6f172a16a427fdb78770380dbba763df5b94', 'member', '2024-10-14 07:17:17', '2024-10-14 08:17:17', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(26, 2, '845be8a9e9f9eca5443b8a35b2248b94a05905e75310404f2b6adedf36807196', 'member', '2024-10-14 07:19:09', '2024-10-14 08:19:09', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(27, 31, '22eeb16a93c53223735501922e576252af10f018a691be67ae4bb67679c2f370', 'rider', '2024-10-14 13:21:17', '2024-10-14 14:21:17', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(28, 3, '9f3bd6e8dcf27d673d68e3223749bbad46ad982510494584e16093bf81fb5b6e', 'member', '2024-10-15 09:22:21', '2024-10-15 10:22:21', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(29, 4, '650a9456c80a315a2af61cb684751be79560bbb9338585143d7e1f181057d592', 'member', '2024-10-15 09:30:21', '2024-10-15 10:30:21', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(30, 32, 'f6a1503a8a88d65f900fb38ddf7510ed7dc6c5d34a3b6bd7efca09112524c9ba', 'rider', '2024-10-24 07:55:01', '2024-10-24 08:55:01', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(31, 5, 'c0f2260557c5797a0504a08fa782d0a601dde35c03eccf968b5e5ec1b8f7279b', 'member', '2024-10-24 08:04:11', '2024-10-24 09:04:11', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(32, 33, '92eaa5dacedd640bd8144f62bf6def6e287d98855a40e190b3b0fd3bb29bf06f', 'rider', '2024-10-29 08:58:07', '2024-10-29 09:58:07', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(33, 6, '028d301b7402c1b57d61ec81d9ea15c4e7d6340ab82d15fa0590816e9064a5fb', 'member', '2024-10-29 12:36:44', '2024-10-29 13:36:44', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(34, 7, '5aca627510c9cb4f798b06f93019ba72a9355e9356a120c7e43991b714a4ee78', 'member', '2024-10-29 12:37:51', '2024-10-29 13:37:51', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(35, 8, '5a9e594d32f2c1487d9393c16184f51ddc869fdb2d089f5f0f4bd6497e2ab7f8', 'member', '2024-10-29 12:58:14', '2024-10-29 13:58:14', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(36, 8, '251dbca5b1e16a3dac3c0eec97dfbddb32f97ea7ddf2bcc042e064f41373f452', 'reset', '2024-10-29 12:58:50', '2024-10-29 13:58:50', NULL, NULL),
(37, 8, 'c28b9adb1f770e5daf705143ab5c49ab5f64fe5a8a7b595cee6661b7dd920106', 'reset', '2024-10-29 12:59:41', '2024-10-29 13:59:41', NULL, NULL),
(38, 8, '481fec8ca22e90d562b40fc7ce46b498ca75bbaf5e7748cb323f4da2b78fbdec', 'reset', '2024-10-29 13:12:43', '2024-10-29 14:12:43', NULL, NULL),
(39, 9, '8bea05f665cfbad49055ca4714c0cdcf0d2b8da1497285309212dec69058609b', 'member', '2024-10-29 13:26:57', '2024-10-29 14:26:57', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43', NULL),
(40, 9, '687a128f18154e46741a71b5f7bf7924346de985a72a374f14df012b3f17def5', 'reset', '2024-10-30 06:37:30', '2024-10-30 07:37:30', NULL, NULL),
(41, 9, '63216379d3d722382e357f06a38dbf8f24de01082b5d04db7ad0712840f1d2a4', 'reset', '2024-10-30 07:20:16', '2024-10-30 08:20:16', NULL, NULL),
(42, 9, 'b1d83e5ac99aaabe2d0ddff3d40fb0a39a23ca2faa0f856f3f51c314040400bd', 'reset', '2024-10-30 07:20:57', '2024-10-30 08:20:57', NULL, NULL),
(43, 9, 'cb6ec290a3b9207532bb78c22277c17f1933daa761ccabce96d717927212ff72', 'reset', '2024-10-30 07:25:32', '2024-10-30 08:25:32', NULL, NULL),
(44, 9, 'ed82ed8cd7b576ab09716c49b70d31478a91acb81a8f3df1d8af4581130fe21f', 'reset', '2024-10-30 07:34:25', '2024-10-30 08:34:25', NULL, NULL),
(45, 9, 'reset', '24da002466dd842033a5f939e7ba178868779cdbed592afda4', '2024-10-30 07:36:19', '2024-10-30 08:36:19', NULL, NULL),
(46, 9, 'reset', '78a0f26cd0d038c34f1412b42feb18d06837b401100fcef135', '2024-10-30 07:37:55', '2024-10-30 08:37:55', NULL, NULL),
(47, 9, 'e2d06242dc8c5379ca426c93c2e2ead0f96ebba412178fd4b245d8897148e419', 'reset', '2024-10-30 07:39:22', '2024-10-30 08:39:22', NULL, NULL),
(48, 9, 'member', '3719bb5955755a6c63346658f4d097aaaaadd2457e8ad68619', '2024-10-30 07:46:49', '0000-00-00 00:00:00', '2024-10-30 13:46:49.541', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43'),
(49, 9, 'member', 'd64032803cac14168320355b769d2f41feb480adecbae61878', '2024-10-30 08:13:56', '0000-00-00 00:00:00', '2024-10-30 14:13:56.431', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43'),
(50, 9, 'member', '25fe88e26c8e3e0d59704794ef0996b95b3e7edbc5bd2dbb1f', '2024-10-30 08:16:26', '0000-00-00 00:00:00', '2024-10-30 14:16:26.372', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43'),
(51, 9, 'member', 'd365bddee567fdfb2a4029cb87cf2264aa30bc2f8b79a840d7', '2024-10-30 08:59:44', '0000-00-00 00:00:00', '2024-10-30 14:59:44.889', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43'),
(52, 9, 'member', '1972a2f6685ce799493e225700e17426b70066e7ba86e06f33', '2024-10-30 09:03:04', '0000-00-00 00:00:00', '2024-10-30 15:03:04.030', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43'),
(53, 9, 'member', '31b0afab2abd767f6ea11c52504334eb32b9996f4ad3daefb1', '2024-10-30 09:06:38', '0000-00-00 00:00:00', '2024-10-30 15:06:38.474', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43'),
(54, 9, 'member', 'c20104af1a84871943be2abd84dfd735a747d01533c2749d92', '2024-10-30 09:16:46', '0000-00-00 00:00:00', '2024-10-30 15:16:46.595', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43'),
(55, 9, 'member', '35c47e20d22fe1d47b6882191e8b0d755e8160b3d34759c3cf', '2024-10-30 10:02:40', '0000-00-00 00:00:00', '2024-10-30 16:02:40.762', 'b888157b1eba60396ad256fbd282f0df124238db6c0cdd30228785c4d823bc43'),
(56, 21, 'fe663921808eb53b904d9354e5c95288be13b80aef7427e71402b037a08375f9', 'user', '2024-11-17 12:21:47', '2024-11-17 13:21:47', '82ab3e00f56b7c80ae3c3aa7d090fd532293c0005d6e09e316ac749de56ff7fd', 'user'),
(57, 22, '790e25004a49d1b7b0f612fb8030319876d7706cd8bd8134e564d669919426dc', 'user', '2024-11-17 12:23:17', '2024-11-17 13:23:17', '82ab3e00f56b7c80ae3c3aa7d090fd532293c0005d6e09e316ac749de56ff7fd', 'user'),
(58, 23, '3bf58707368f38c1279e32877c2303b69a7a8f7736a0db31e0cce618a6feb42b', 'user', '2024-11-17 13:46:23', '2024-11-17 14:46:23', '82ab3e00f56b7c80ae3c3aa7d090fd532293c0005d6e09e316ac749de56ff7fd', 'user'),
(59, 24, '7453cd15d3059e62bc09df4702a3a83a4538b005c352407216650d484af493b2', 'user', '2024-11-17 13:50:01', '2024-11-17 14:50:01', '82ab3e00f56b7c80ae3c3aa7d090fd532293c0005d6e09e316ac749de56ff7fd', 'user'),
(60, 25, '42f5b94b578fd7d1c6596fc9f45a9ed713256a4cee64db5b09fca30141f779d5', 'user', '2024-11-17 13:52:29', '2024-11-17 14:52:29', '82ab3e00f56b7c80ae3c3aa7d090fd532293c0005d6e09e316ac749de56ff7fd', 'user'),
(61, 26, '1b7b7d689412c09418333b8223380a6ec55a173691ec2060ed6005f3490f6ecb', 'user', '2024-11-17 13:53:52', '2024-11-17 14:53:52', '82ab3e00f56b7c80ae3c3aa7d090fd532293c0005d6e09e316ac749de56ff7fd', 'user'),
(62, 27, '04871391a254bb7c2eb51fb717c073a97a2c6b6986a18a9c5d083d75e114a543', 'user', '2024-11-17 13:59:06', '2024-11-17 14:59:06', '82ab3e00f56b7c80ae3c3aa7d090fd532293c0005d6e09e316ac749de56ff7fd', 'user'),
(63, 28, 'db3232b04377c9b4a3f2f4ae8e58f6ef4fbfde38e92f4635fccbbbbf78f85abe', 'user', '2024-11-17 14:02:14', '2024-11-17 15:02:14', '82ab3e00f56b7c80ae3c3aa7d090fd532293c0005d6e09e316ac749de56ff7fd', 'user'),
(64, 29, '072e1c99cc89a6924e7f6cd264ad076be600ff42348481c176145974432969fd', 'user', '2024-11-17 14:06:02', '2024-11-17 15:06:02', '82ab3e00f56b7c80ae3c3aa7d090fd532293c0005d6e09e316ac749de56ff7fd', 'user'),
(65, 30, 'c0c4e788ac6e88a42061d7039769c11fac958b975e247a8f5dd90cafc8c8f28a', 'user', '2024-11-17 14:14:24', '2024-11-17 15:14:24', '82ab3e00f56b7c80ae3c3aa7d090fd532293c0005d6e09e316ac749de56ff7fd', 'user'),
(66, 31, '94120229cc8b9293338e30daa36b3b1c73ec69494e36a0022c79047cbd7ff75c', 'user', '2024-11-17 14:19:01', '2024-11-17 15:19:01', '82ab3e00f56b7c80ae3c3aa7d090fd532293c0005d6e09e316ac749de56ff7fd', 'user'),
(67, 32, '0168114988546d86d2e4e7ba021a9016062c9a65a6b1383ede5aeea0bdd0f048', 'user', '2024-11-17 14:24:02', '2024-11-17 15:24:02', '82ab3e00f56b7c80ae3c3aa7d090fd532293c0005d6e09e316ac749de56ff7fd', 'user'),
(68, 33, 'fa03e655b956c424ad0b845dfcee4435d9e34f1e4bb8bfbceb7c75ebc92b3177', 'user', '2024-11-17 14:27:27', '2024-11-17 15:27:27', '82ab3e00f56b7c80ae3c3aa7d090fd532293c0005d6e09e316ac749de56ff7fd', 'user');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `price` varchar(255) DEFAULT NULL,
  `status` tinyint(255) DEFAULT NULL,
  `vehicle_image` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `title`, `price`, `status`, `vehicle_image`) VALUES
(1, 'Car', '500', 1, '1731562683628-929475679.webp'),
(2, 'Truck', '200', 1, '1731562530740-895353201.jpg');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `faqs`
--
ALTER TABLE `faqs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `multi_text`
--
ALTER TABLE `multi_text`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pages`
--
ALTER TABLE `pages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `remote_post_codes`
--
ALTER TABLE `remote_post_codes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `request_parcels`
--
ALTER TABLE `request_parcels`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `request_quote`
--
ALTER TABLE `request_quote`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `riders`
--
ALTER TABLE `riders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_admin`
--
ALTER TABLE `tbl_admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `team_members`
--
ALTER TABLE `team_members`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `testimonials`
--
ALTER TABLE `testimonials`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tokens`
--
ALTER TABLE `tokens`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `faqs`
--
ALTER TABLE `faqs`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `members`
--
ALTER TABLE `members`
  MODIFY `id` int(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `multi_text`
--
ALTER TABLE `multi_text`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `pages`
--
ALTER TABLE `pages`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `remote_post_codes`
--
ALTER TABLE `remote_post_codes`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `request_parcels`
--
ALTER TABLE `request_parcels`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `request_quote`
--
ALTER TABLE `request_quote`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `riders`
--
ALTER TABLE `riders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_admin`
--
ALTER TABLE `tbl_admin`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `team_members`
--
ALTER TABLE `team_members`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `testimonials`
--
ALTER TABLE `testimonials`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `tokens`
--
ALTER TABLE `tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
