import {LayoutDashboard,ChartNoAxesCombined,ShoppingBag,CalendarRange,Boxes,CalendarCheck,Palette,HardHat,CircleDollarSign,MessageSquare,Phone,Users,UserCog,PackageCheck,LayoutTemplate,Tag,FileText,Truck,Megaphone,BookOpen,Bot,Settings,UserRound,TrendingUp,ClipboardList,BriefcaseBusiness,IdCard,Contact,Store,PanelsTopLeft,UsersRound,Handshake,type LucideIcon} from 'lucide-react';
// Items with children render as an expandable group: the label opens the parent page, the chevron shows sub-pages.
// `soon` marks a planned page that has no route yet; it is shown but not linked.
export type DashboardNavItem={label:string;href:string;icon:LucideIcon;children?:DashboardNavItem[];soon?:boolean};
export const dashboardNavigation:{label:string;items:DashboardNavItem[]}[]=[
 {label:'Main',items:[
  {label:'Dashboard',href:'/admin',icon:LayoutDashboard},{label:'Analytics',href:'/admin/analytics',icon:ChartNoAxesCombined},
  {label:'Contacts',href:'/admin/contacts',icon:Users,children:[
   {label:'Customers',href:'/admin/customers',icon:Contact},{label:'Designers',href:'/admin/designers',icon:Palette},{label:'Installers',href:'/admin/installers',icon:HardHat},
   {label:'Vendors',href:'/admin/vendors',icon:Store,soon:true},{label:'Users',href:'/admin/users',icon:UserCog},
  ]},
  {label:'Pipeline',href:'/admin/pipeline',icon:TrendingUp,children:[
   {label:'Leads',href:'/admin/leads',icon:UserRound},{label:'Jobs',href:'/admin/jobs',icon:BriefcaseBusiness},
  ]},
  {label:'Business Cards',href:'/admin/business-cards',icon:IdCard},{label:'Orders',href:'/admin/orders',icon:ShoppingBag},
  {label:'Production',href:'/admin/production',icon:Boxes},{label:'Bookings',href:'/admin/bookings',icon:CalendarCheck},
  {label:'Payments',href:'/admin/payments',icon:CircleDollarSign},
  {label:'Communication',href:'/admin/communications',icon:Phone,children:[
   {label:'Messages',href:'/admin/messages',icon:MessageSquare},{label:'Form Submissions',href:'/admin/contact-submissions',icon:FileText},
  ]},
  {label:'Portals',href:'/admin/portals',icon:Users},
  {label:'Workspace',href:'/admin/workspace',icon:FileText,children:[
   {label:'Plans',href:'/admin/plans',icon:ClipboardList},{label:'Projects',href:'/admin/production-schedule',icon:CalendarRange},
  ]},
 ]},
 {label:'Catalog',items:[
  {label:'Products',href:'/admin/products',icon:PackageCheck,children:[
   {label:'Coupons',href:'/admin/coupons',icon:Tag},{label:'Shipping',href:'/admin/shipments',icon:Truck},
  ]},
  {label:'Wall Studio',href:'/admin/wall-studio',icon:LayoutTemplate},{label:'Artwork',href:'/admin/artwork',icon:FileText},{label:'Marketing',href:'/admin/marketing',icon:Megaphone},
  {label:'CMS',href:'/admin/content',icon:PanelsTopLeft,children:[
   {label:'LFX Team',href:'/admin/team',icon:UsersRound},{label:'Partners',href:'/admin/partners',icon:Handshake},{label:'Blog Posts',href:'/admin/blog',icon:BookOpen},
  ]},
 ]},
 {label:'System',items:[{label:'Agents',href:'/admin/agent',icon:Bot},{label:'Settings',href:'/admin/settings',icon:Settings},{label:'Profile',href:'/admin/profile',icon:UserRound}]},
];
