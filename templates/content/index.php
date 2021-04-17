<h1 class="inlineblock"><?php p($l->t('Groupfolders for General Manager')); ?></h1>
<div class="section">
    <?php
        for($number = 0; $number < count($_['users']); $number++){
            p( "- " . $_['users'][$number]->getDisplayName());
            print('<br/>');

            p( "- " . $_['users'][$number]->getUID());
            print('<br/>');

            p( "- " . $_['users'][$number]->getBackendClassName());
            print('<br/>');

        }

    ?>
</div>
<div class="section">
    <form id="workspaceform" action="https://nc21.dev.arawa.fr/apps/groupfolders/folders" method="POST">
        <input type="text" id="inputGF" placeholder="<?php p($l->t('Enter the groupfolder name')); ?>" name="mountpoint" style="width: 320px;">

        <br>

        <label><?php p($l->t('This is the Espace Manager name :')) ?></label>
        <input type="text" disabled value="Manager_" style="width:75px;" ><input name="espaceManagerName" id="espaceManagerName" type="text" disabled>

        <br>

        <label><?php p($l->t('This is the User Workspace Group name :')) ?></label>
        <input type="text" disabled value="Users_" style="width:75px;" ><input name="workspaceUserGroupName" id="workspaceUserGroupName" type="text" disabled>
        
        <br>

        <label for="userEspaceManager"><?php p($l->t('Select the Espace Manager')) ?></label>
        <input type="text" name="userEspaceManager" id="userEspaceManager" style="width:200px;">
       
        <br>

        <button type="submit" id='workspaceSubmit'><?php p($l->t('Send')); ?></button>

    </form>
</div>