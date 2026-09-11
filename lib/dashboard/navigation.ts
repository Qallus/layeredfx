import {LayoutDashboard,ChartNoAxesCombined,ShoppingBag,CalendarRange,Boxes,CalendarCheck,Palette,HardHat,CircleDollarSign,MessageSquare,Phone,Users,UserCog,PackageCheck,LayoutTemplate,Tag,FileText,Truck,Megaphone,BookOpen,Bot,Settings,UserRound,TrendingUp,ClipboardList,BriefcaseBusiness} from 'lucide-react';
export const dashboardNavigation=[
 {label:'Main',items:[
  {label:'Dashboard',href:'/admin',icon:LayoutDashboard},{label:'Analytics',href:'/admin/analytics',icon:ChartNoAxesCombined},
  {label:'Contacts',href:'/admin/contacts',icon:Users},{label:'Leads',href:'/admin/leads',icon:UserRound},{label:'Pipeline',href:'/admin/pipeline',icon:TrendingUp},{label:'Orders',href:'/admin/orders',icon:ShoppingBag},
  {label:'Jobs',href:'/admin/jobs',icon:BriefcaseBusiness},{label:'Projects',href:'/admin/production-schedule',icon:CalendarRange},
  {label:'Production',href:'/admin/production',icon:Boxes},{label:'Bookings',href:'/admin/bookings',icon:CalendarCheck},
  {label:'Designers',href:'/admin/designers',icon:Palette},{label:'Installers',href:'/admin/installers',icon:HardHat},
  {label:'Payments',href:'/admin/payments',icon:CircleDollarSign},{label:'Messages',href:'/admin/messages',icon:MessageSquare},
  {label:'Communication',href:'/admin/communications',icon:Phone},{label:'Customers',href:'/admin/customers',icon:Users},
  {label:'Users',href:'/admin/users',icon:UserCog},{label:'Workspace',href:'/admin/workspace',icon:FileText},
  {label:'Plans',href:'/admin/plans',icon:ClipboardList},
 ]},
 {label:'Catalog',items:[{label:'Products',href:'/admin/products',icon:PackageCheck},{label:'Wall Studio',href:'/admin/wall-studio',icon:LayoutTemplate},{label:'Coupons',href:'/admin/coupons',icon:Tag},{label:'Artwork',href:'/admin/artwork',icon:FileText},{label:'Shipping',href:'/admin/shipments',icon:Truck},{label:'Marketing',href:'/admin/marketing',icon:Megaphone},{label:'Blog Posts',href:'/admin/blog',icon:BookOpen},{label:'Content',href:'/admin/content',icon:FileText}]},
 {label:'System',items:[{label:'Agents',href:'/admin/agent',icon:Bot},{label:'Settings',href:'/admin/settings',icon:Settings},{label:'Profile',href:'/admin/profile',icon:UserRound}]},
];
