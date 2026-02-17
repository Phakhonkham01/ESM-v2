import { useIntl } from 'react-intl'
import { AsideMenuItemWithSub } from './AsideMenuItemWithSub'
import { AsideMenuItem } from './AsideMenuItem'

export function AsideMenuMain() {
  const intl = useIntl()

  return (
    <>
      <AsideMenuItem
        to='/dashboard'
        icon='color-swatch'
        title={intl.formatMessage({ id: 'MENU.DASHBOARD' })}
        fontIcon='bi-app-indicator'
      />
      <AsideMenuItem to='/builder' icon='switch' title='Layout Builder' fontIcon='bi-layers' />
      <div className='menu-item'>
        <div className='menu-content pt-8 pb-2'>
          <span className='menu-section text-muted text-uppercase fs-8 ls-1'>Crafted</span>
        </div>
      </div>
      <AsideMenuItemWithSub
        to='/crafted/pages'
        title='Pages'
        fontIcon='bi-archive'
        icon='element-plus'
      >
        <AsideMenuItemWithSub to='/crafted/pages/profile' title='Profile' hasBullet={true}>
          <AsideMenuItem to='/crafted/pages/profile/overview' title='Overview' hasBullet={true} />
          <AsideMenuItem to='/crafted/pages/profile/projects' title='Projects' hasBullet={true} />
          <AsideMenuItem to='/crafted/pages/profile/campaigns' title='Campaigns' hasBullet={true} />
          <AsideMenuItem to='/crafted/pages/profile/documents' title='Documents' hasBullet={true} />
          <AsideMenuItem
            to='/crafted/pages/profile/connections'
            title='Connections'
            hasBullet={true}
          />
        </AsideMenuItemWithSub>

        <AsideMenuItemWithSub to='/crafted/pages/wizards' title='Wizards' hasBullet={true}>
          <AsideMenuItem
            to='/crafted/pages/wizards/horizontal'
            title='Horizontal'
            hasBullet={true}
          />
          <AsideMenuItem to='/crafted/pages/wizards/vertical' title='Vertical' hasBullet={true} />
        </AsideMenuItemWithSub>
      </AsideMenuItemWithSub>
      <AsideMenuItemWithSub
        to='/crafted/accounts'
        title='Accounts'
        icon='profile-circle'
        fontIcon='bi-person'
      >
        <AsideMenuItem to='/crafted/account/overview' title='Overview' hasBullet={true} />
        {/* <AsideMenuItem to='/crafted/account/settings' title='Settings' hasBullet={true} /> */}
      </AsideMenuItemWithSub>
      <AsideMenuItemWithSub to='/error' title='Errors' fontIcon='bi-sticky' icon='cross-circle'>
        <AsideMenuItem to='/error/404' title='Error 404' hasBullet={true} />
        <AsideMenuItem to='/error/500' title='Error 500' hasBullet={true} />
      </AsideMenuItemWithSub>
      <AsideMenuItemWithSub
        to='/crafted/widgets'
        title='Widgets'
        icon='element-11'
        fontIcon='bi-layers'
      >
        <AsideMenuItem to='/crafted/widgets/lists' title='Lists' hasBullet={true} />
        <AsideMenuItem to='/crafted/widgets/statistics' title='Statistics' hasBullet={true} />
        <AsideMenuItem to='/crafted/widgets/charts' title='Charts' hasBullet={true} />
        <AsideMenuItem to='/crafted/widgets/mixed' title='Mixed' hasBullet={true} />
        <AsideMenuItem to='/crafted/widgets/tables' title='Tables' hasBullet={true} />
        <AsideMenuItem to='/crafted/widgets/feeds' title='Feeds' hasBullet={true} />
      </AsideMenuItemWithSub>
      <div className='menu-item'>
        <div className='menu-content pt-8 pb-2'>
          <span className='menu-section text-muted text-uppercase fs-8 ls-1'>Apps</span>
        </div>
      </div>
      <AsideMenuItemWithSub
        to='/apps/chat'
        title='Chat'
        fontIcon='bi-chat-left'
        icon='message-text-2'
      >
        <AsideMenuItem to='/apps/chat/private-chat' title='Private Chat' hasBullet={true} />
        <AsideMenuItem to='/apps/chat/group-chat' title='Group Chart' hasBullet={true} />
        <AsideMenuItem to='/apps/chat/drawer-chat' title='Drawer Chart' hasBullet={true} />
      </AsideMenuItemWithSub>
      <AsideMenuItem
        to='/apps/user-management/users'
        icon='people'
        title='User management'
        fontIcon='bi-layers'
      />
             <AsideMenuItem
      
        to='/crafted/requestsdayoffuser'
        icon='calendar-edit'
        title='Request Day-Off-user'
        fontIcon='bi-calendar-event'
      />
         <AsideMenuItem
        to='/apps/salary-management/salarylist'
        icon='calendar-edit'
        title='Salary Management'
        fontIcon='bi-calendar-event'
      />  
      <AsideMenuItem
        to='/apps/request-ot-field-work-user/ot&fieldworklist'
        icon='people'
        title='Request OT/Field Work user'
        fontIcon='bi-layers'
      />
      <AsideMenuItem
        to='/apps/sat-sun-request/sat-sun-request-list'
        icon='people'
        title='Sat-Sun Request List user'
        fontIcon='bi-layers'
      />
      <AsideMenuItem
        to='/apps/request-day-off'
        icon='people'
        title='Request Day-Off'
        fontIcon='bi-layers'
      />

      {/* Atteendace management sidebar */}
      <AsideMenuItemWithSub
        to=''
        title='Attendance management'
        fontIcon='bi-archive'
        icon='element-plus'
      >
        <AsideMenuItem
          to='/apps/overtime'
          title='OT information'
          hasBullet={true}
        />
        <AsideMenuItem
          to='/apps/field-work'
          title='Field Work information'
          hasBullet={true}
        />
        <AsideMenuItem
          to='/apps/day-off'
          title='Dayoff information'
          hasBullet={true}
        />
      </AsideMenuItemWithSub>
      {/* End Atteendace management sidebar */}

      <AsideMenuItem
        to='/crafted/account/overview'
        icon='calendar-edit'
        title='User-Profile'
        fontIcon='bi-calendar-event'
      />
      <AsideMenuItem
        to='/apps/requests'
        icon='check-circle'
        title='Requests Ot/Field Work Supervisor'
        fontIcon='bi-calendar-event'
      />
    <AsideMenuItem
        to='/apps/salary-history'
        icon='check-circle'
        title='Salary History'
        fontIcon='bi-calendar-event'
      />
    </>
  )
}