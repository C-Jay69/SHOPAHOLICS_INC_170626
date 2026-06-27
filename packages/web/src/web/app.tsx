import { Route, Switch } from "wouter";
import { Provider } from "./components/provider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Index from "./pages/index";
import Category from "./pages/category";
import Product from "./pages/product";
import Cart from "./pages/cart";
import Checkout from "./pages/checkout";
import OrderSuccess from "./pages/order-success";
import Account from "./pages/account";
import SearchPage from "./pages/search";
import FAQ from "./pages/faq";
import Contact from "./pages/contact";
import Admin from "./pages/admin";
import Login from "./pages/login";
import Signup from "./pages/signup";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Provider>
      <Layout>
        <Switch>
          <Route path="/" component={Index} />
          <Route path="/category/:slug" component={Category} />
          <Route path="/product/:id" component={Product} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/order-success" component={OrderSuccess} />
          <Route path="/account" component={Account} />
          <Route path="/account/:tab" component={Account} />
          <Route path="/search" component={SearchPage} />
          <Route path="/faq" component={FAQ} />
          <Route path="/contact" component={Contact} />
          <Route path="/admin" component={Admin} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route>
            <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-4">
              <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
              <p className="text-gray-400 text-xl mb-8">This page went shopping and never came back.</p>
              <a href="/" className="btn-primary px-8 py-3 rounded-xl font-semibold">Go Home</a>
            </div>
          </Route>
        </Switch>
      </Layout>
    </Provider>
  );
}

export default App;
