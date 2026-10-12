import { Routes, Route } from 'react-router-dom';
import { AnnouncementBar } from './components/AnnouncementBar.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { ChatWidget } from './components/ChatWidget.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ShopPage } from './pages/ShopPage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { CartPage } from './pages/CartPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { OrdersPage } from './pages/OrdersPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { StaticPage } from './pages/StaticPage.tsx';

function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-neutral-950 dark:text-gray-100 flex flex-col transition-colors duration-300">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/about"
            element={
              <StaticPage
                title="About"
                body="IvRaws is a streetwear label for the next generation — fashion built for movement, made to stand out. This is a sample storefront; full brand story coming soon."
              />
            }
          />
          <Route
            path="/shipping"
            element={
              <StaticPage
                title="Shipping"
                body="We ship across India with cash-on-delivery available at checkout. Full shipping rates and timelines will be published here."
              />
            }
          />
          <Route
            path="/returns"
            element={
              <StaticPage
                title="Returns"
                body="Easy 30-day returns on unworn items with tags attached. Full return policy details will be published here."
              />
            }
          />
          <Route
            path="/privacy"
            element={
              <StaticPage
                title="Privacy Policy"
                body="This is a sample storefront — a full privacy policy covering data collection and use will be published here before launch."
              />
            }
          />
          <Route
            path="/terms"
            element={
              <StaticPage
                title="Terms of Service"
                body="This is a sample storefront — full terms of service will be published here before launch."
              />
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

export default App;
