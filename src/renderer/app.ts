import "../renderer/components/app-header.js";
import "../renderer/components/app-toast.js";
import "../renderer/components/app-swal.js";

import { startRouter, registerRoute, navigate } from "./core/router.js";
//import { DirectoryPage } from "./pages/directory/directory.page.js";
//import { PaymentsPage } from "./pages/payments/payments.page.js";

const outlet = document.getElementById("outlet");

//registerRoute("directory", DirectoryPage);
//registerRoute("payments", PaymentsPage);

document.addEventListener("nav", ((e: CustomEvent<{ route: string }>) => {
    console.log(e.detail.route);
}) as EventListener);


startRouter(outlet);
